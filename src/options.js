// Saves options to chrome.storage
const saveOptions = () => {
  const mapsPosition = document.getElementById("mapsPosition").value;

  chrome.storage.sync.set({ mapsPosition: mapsPosition }, () => {
    // Update status to let user know options were saved.
    const status = document.getElementById("status");
    status.textContent = "Position saved.";
    setTimeout(() => {
      status.textContent = "";
    }, 750);
  });
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
  chrome.storage.sync.get({ mapsPosition: 4 }, (items) => {
    document.getElementById("mapsPosition").value = items.mapsPosition;
    M.updateTextFields();
  });
};

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
