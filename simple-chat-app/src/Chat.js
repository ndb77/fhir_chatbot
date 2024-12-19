import React, { useState } from 'react';
import './Chat.css'; // Optional: for styling

const Chat = () => {
    const [messages, setMessages] = useState(['Please enter your patient ID as the first message.']);
    const [inputValue, setInputValue] = useState('');
    const [patientId, setPatientId] = useState('');

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    };

    const handleSendMessage = async () => {
        if (inputValue.trim()) {
            const userMessage = inputValue;
            setMessages([...messages, userMessage]);
            setInputValue(''); // Clear the input field
    
            // Check if the first message is the patient-id
            if (patientId==='') { // First user message                
                // Check if the patient exists
                try {
                    const response = await fetch(`http://localhost:3000/fhir/Patient/${userMessage}`);
                    if (!response.ok) {
                        setMessages((prevMessages) => [...prevMessages, `Patient with ID ${userMessage} does not exist. Please try again.`]);
                        return; // Exit the function
                    }
                    setPatientId(userMessage); // Store the patient-id
                    const autoResponse = `Hello, ${userMessage}, how may I assist you.`;
                    setMessages((prevMessages) => [...prevMessages, autoResponse]);
                } catch (error) {
                    console.error('Error checking patient existence:', error);
                    setMessages((prevMessages) => [...prevMessages, 'An error occurred while checking the patient ID. Please try again.']);
                }
            } else {
                // Only send messages to the AI if a valid patient ID has been set
                if (patientId) {
                    try {
                        const response = await fetch('http://localhost:1234/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                model: "internlm2_5-20b-chat",
                                messages: [
                                    { role: "system", content: `You are a pharmacist that is able to respond to the user's 
                                        question. Your task is to identify the medication the user is asking about and do the following: 1. Provide the correct FHIR or API call. It is important that you do not respond with anything else aside from the API or FHIR call 2a. If the user is asking about a medication side effect, respond by creating the API call: '!API CALL: https://api.fda.gov/drug/label.json?search=openfda.brand_name:medication_name' 2b. If the user is asking about dosage(how much), scheduling(how often or when), or instructions about a medication(by what route of administration), respond by creating the API call: '!FHIR  CALL: http://localhost:3000/fhir/MedicationRequest?patient=${patientId}' 2c. If the user asks about why they are taking the medication, respond with the FHIR call: '!FHIR CALL: http://localhost:3000/fhir/Condition?patient=${patientId}' 3. If the user asks about topics that fulfill more than one criteria, respond by creating all of the appropriate API calls. 4. If you are unable to answer because you cannot provide medical advice, respond by offering to create a FHIR or API call from the instructions in step 2`},
                                    { role: "user", content: userMessage }
                                ],
                                temperature: 0,
                                max_tokens: -1,
                                stream: false
                            }),
                        });
    
                        const data = await response.json();
                        if (data && data.choices && data.choices.length > 0) {
                            const aiMessage = data.choices[0].message.content;
                            
                            // Extract and print FHIR and API calls
                            const fhirCalls = aiMessage.match(/!FHIR CALL: [^\s]+/g) || [];
                            const apiCalls = aiMessage.match(/!API CALL: [^\s]+/g) || [];
                            
                            // Print all FHIR and API calls to the console
                            fhirCalls.forEach(call => console.log(call));
                            apiCalls.forEach(call => console.log(call));
                            
                            setMessages((prevMessages) => [...prevMessages, aiMessage]);
                        }
                    } catch (error) {
                        console.error('Error sending message:', error);
                    }
                } else {
                    // If no valid patient ID, inform the user
                    setMessages((prevMessages) => [...prevMessages, 'Please enter a valid patient ID before sending messages.']);
                }
            }
        }
    };

    return (
        <div className="chat-container">
            <div className="messages">
                {messages.map((message, index) => (
                    <div key={index} className="message">
                        {message}
                    </div>
                ))}
            </div>
            <div className="input-container">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Type your message here..."
                />
                <button onClick={handleSendMessage}>Send</button>
            </div>
        </div>
    );
};

export default Chat;
