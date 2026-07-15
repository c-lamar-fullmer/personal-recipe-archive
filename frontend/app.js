// This will run as soon as the webpage loads in the browser
document.addEventListener("DOMContentLoaded", () => {
    console.log("Frontend JS loaded successfully!");
    
    const container = document.getElementById("recipe-container");
    container.innerHTML = "<p>Ready to connect to the Java backend.</p>";
});