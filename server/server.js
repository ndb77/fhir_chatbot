const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Helper function to read and parse all bundle files
async function getAllBundles() {
    const dataDir = path.join(__dirname, '../data');
    const files = await fs.readdir(dataDir);
    const bundles = await Promise.all(
        files.map(async (file) => {
            const content = await fs.readFile(path.join(dataDir, file), 'utf8');
            return JSON.parse(content);
        })
    );
    return bundles;
}

// Helper function to extract resources of a specific type from bundles
function extractResourcesFromBundles(bundles, resourceType) {
    return bundles.flatMap(bundle => 
        bundle.entry.filter(entry => entry.resourceType === resourceType)
    );
}

// FHIR Resource Routes
app.get('/fhir/:resourceType/:id', async (req, res) => {
    try {
        const { resourceType, id } = req.params;
        const bundles = await getAllBundles();
        
        // Find the resource in any bundle
        let foundResource = null;
        for (const bundle of bundles) {
            const resource = bundle.entry.find(entry => 
                entry.resourceType === resourceType && entry.id === id
            );
            if (resource) {
                foundResource = resource;
                break;
            }
        }

        if (foundResource) {
            res.json(foundResource);
        } else {
            res.status(404).json({
                resourceType: "OperationOutcome",
                issue: [{
                    severity: "error",
                    code: "not-found",
                    diagnostics: `${resourceType} with id ${id} not found`
                }]
            });
        }
    } catch (error) {
        res.status(500).json({
            resourceType: "OperationOutcome",
            issue: [{
                severity: "error",
                code: "internal-error",
                diagnostics: "Error retrieving resource"
            }]
        });
    }
});

// Search endpoints for specific resource types
app.get('/fhir/:resourceType', async (req, res) => {
    try {
        const { resourceType } = req.params;
        const { patient } = req.query;
        const bundles = await getAllBundles();
        const resources = extractResourcesFromBundles(bundles, resourceType);

        console.log(`Found ${resources.length} resources of type ${resourceType}.`);

        // Handle search parameters
        let filteredResources = resources;
        if (patient) {
            const expectedReference = `Patient/${patient}`;
            console.log(`Filtering resources for patient reference: ${expectedReference}`);

            filteredResources = resources.filter(resource => {
                const resourceReference = resource.subject?.reference;
                console.log('Checking resource:', {
                    resourceType: resource.resourceType,
                    reference: resourceReference,
                    expectedReference: expectedReference
                });
                return resourceReference === expectedReference;
            });
        }

        res.json({
            resourceType: "Bundle",
            type: "searchset",
            total: filteredResources.length,
            entry: filteredResources.map(resource => ({
                resource: resource
            }))
        });
    } catch (error) {
        console.error('Error retrieving resources:', error);
        res.status(500).json({
            resourceType: "OperationOutcome",
            issue: [{
                severity: "error",
                code: "internal-error",
                diagnostics: "Error retrieving resources"
            }]
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

app.listen(PORT, () => {
    console.log(`FHIR server running on port ${PORT}`);
}); 