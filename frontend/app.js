// This runs as soon as the webpage loads in the browser
document.addEventListener("DOMContentLoaded", () => {
    console.log("Frontend JS loaded successfully!");
    
    // Select our connection status element
    const statusIndicator = document.getElementById("connection-status");
    
    // Update the indicator instead of wiping out the recipe container!
    statusIndicator.innerText = "Ready to connect to the Java backend.";
    statusIndicator.style.color = "green";
    statusIndicator.style.fontWeight = "bold";
});