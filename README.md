# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).


At present the application takes in the patient ID and addresses the user questions regarding a medication by responding with the correct FHIR or API call. The next step is to use the information gathered from the FHIR or API call to retrieve the relevant information from the database and respond to the user with contextually relevant information.

## Available Scripts

### 1. Changing the AI model

The AI model is currently set to use the InternLM2-5-20B-Chat model, interfacing with the LM Studio API on port 1234 found on line 42 in the ./simple-chat-app/src/Chat.js file. Use LM studio with your desired AI model. ENSURE THAT CORS is enabled in the LM Studio settings.

 IternLM was chosen over Llama 3 because it has less trouble accepting medical instructions without hitting its internal guardrails.

### 2. `npm install --legacy-peer-deps` install the dependencies

### 3. `npm start` to run the application

1. Navigate to the ./server/ and run `npm start` to start the server that will be used to retrieve FHIR resources from the /data/ folder. In the future, this will be replaced with a real database.

2. Navigate to the ./simple-chat-app/ and run `npm start` to start the chat application.