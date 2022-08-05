/* Setup functions */
function setupGoToTopButton() {
    let timeout = null; // Enclosing in a function scope, global scope was a bad design

    let button = document.querySelector(".page-navigator");
    button.addEventListener('mouseenter', () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    });
    button.addEventListener('mouseleave', () => {
        // We need to set the timeout again
        if (!timeout) {
            timeout = setTimeout(() => {
                button.style.display = "none";
            }, 1000*2);
        }
    });

    document.addEventListener('scroll', () => {
        let button = document.querySelector(".page-navigator");
        button.style.display = "block";
        if (timeout) { // Clear the old timeout
            clearTimeout(timeout);
            timeout = null;
        }
        timeout = setTimeout(() => {
            button.style.display = "none";
        }, 1000*2);
    });

    
}

function scrollToSection() {
    let anchor = document.getElementById("scroll");
    if (anchor) anchor.click();
}

function setup() {
    // Setting up the events for the page
    setupGoToTopButton();
    // Go to anchor
    scrollToSection();
}

window.onload = setup;
