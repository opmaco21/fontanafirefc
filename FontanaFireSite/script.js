// Wait until the page is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("Fontana Fire Site is live!");

  // Example: Change the heading color when clicked
  const heading = document.querySelector("h1");
  heading.addEventListener("click", () => {
    heading.style.color = "#1976d2";
    heading.textContent = "You clicked the heading!";
  });
});
