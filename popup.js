function communicateWithBackend(data) {
    
    // Define the messaging function
    let queryTabs = chrome.tabs.query;
    let sendMessage = chrome.tabs.sendMessage;

    // Get the currently active tab
    queryTabs({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length > 0) {
            // Correctly use chrome.tabs.sendMessage to send a message to the content script of the tab
            sendMessage(tabs[0].id, data, function(response) {
                if (chrome.runtime.lastError) {
                    console.log("Error sending message: " + chrome.runtime.lastError.message);
                    if (data.action === 'enableExtension')
                        chrome.storage.sync.set({'checkboxState': false});
                } else if (response) 
                    console.log(response.status);
            });

        }
    });
}


chrome.storage.sync.get('checkboxState', function(data) {
    const checkbox = document.getElementById('enable-extension');
    checkbox.checked = data.checkboxState || false; // Default to false if not set

    if (data.checkboxState == true) {
        communicateWithBackend(
            {action: "enableExtension", enableExtension: true }
        )   
    }
});
chrome.storage.sync.get('colorPicked', function(data) {
    const colorPicker = document.getElementById('colorPicker');
    colorPicker.value = data.colorPicked || "#000000"

    communicateWithBackend({'action': 'changeColor', 'color': data.colorPicked})
});


document.getElementById('colorPicker').addEventListener('input', function() {
    let colorValue = this.value; // Cache the color value
    
    chrome.storage.sync.set({'colorPicked': this.value});
    
    communicateWithBackend(
        {action: "changeColor", color: colorValue }
    )

});
document.getElementById('enable-extension').addEventListener('change', (e) => {
    let extensionIsToggled = e.currentTarget.checked;
    
    chrome.storage.sync.set({'checkboxState': e.currentTarget.checked});

    communicateWithBackend(
        {action: "enableExtension", enableExtension: extensionIsToggled }
    )
});
