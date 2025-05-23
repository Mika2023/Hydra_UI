// Programming languages list
const programmingLanguages = [
    "Python",
    "Java",
    "Haskell"
];

const API_BASE = 'http://127.0.0.1:5000'; // сервер бэка
    const ENDPOINTS = {
        translate: '/translate',
        languages: '/v1/code/languages'
    };
 
// DOM elements
const sourceLanguageSelect = document.getElementById('sourceLanguage');
const targetLanguageSelect = document.getElementById('targetLanguage');
const sourceCodeTextarea = document.getElementById('sourceCode');
const translatedCodeTextarea = document.getElementById('translatedCode');
const translateButton = document.getElementById('translateButton');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const fileUpload = document.getElementById('fileUpload');
const fileUploadArea = document.getElementById('fileUploadArea');
const fileName = document.getElementById('fileName');
const filePreview = document.getElementById('filePreview');
const filePreviewContent = document.getElementById('filePreviewContent');
const getStartedBtn = document.getElementById('getStartedBtn');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const showMoreLink = document.getElementById('showMoreLink')
const translatedDSLArea = document.getElementById('translatedDSL')
const parsedCodeArea = document.getElementById('translatedParse')
const translatedAreas = document.querySelector('.generated-area')

// State variables
let sourceLanguage = '';
let targetLanguage = '';
let sourceCode = '';
let isTranslating = false;

// Populate language dropdowns
function populateLanguageDropdowns() {
    programmingLanguages.forEach(lang => {
        const sourceOption = document.createElement('option');
        sourceOption.value = lang;
        sourceOption.textContent = lang;
        sourceLanguageSelect.appendChild(sourceOption);

        const targetOption = document.createElement('option');
        targetOption.value = lang;
        targetOption.textContent = lang;
        targetLanguageSelect.appendChild(targetOption);
    });
}

// Tab switching functionality
function setupTabs() {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const tabName = tab.getAttribute('data-tab');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

// File upload handling
function setupFileUpload() {
    fileUploadArea.addEventListener('click', () => {
        fileUpload.click();
    });

    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = '#6b9ac4';
    });

    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.style.borderColor = '#d9e2ec';
    });

    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = '#d9e2ec';
        
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileUpload.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });
}

function handleFile(file) {
    fileName.textContent = `Selected file: ${file.name}`;
    fileName.style.display = 'block';
    
    const reader = new FileReader();
    reader.onload = (event) => {
        sourceCode = event.target.result;
        sourceCodeTextarea.value = sourceCode;
        
        // Show preview
        filePreview.style.display = 'block';
        filePreviewContent.textContent = sourceCode.length > 500 
            ? `${sourceCode.substring(0, 500)}...` 
            : sourceCode;
        
        updateTranslateButtonState();
    };
    reader.readAsText(file);
}

// Translation functionality
function setupTranslation() {
    sourceLanguageSelect.addEventListener('change', (e) => {
        sourceLanguage = e.target.value;
        updateTranslateButtonState();
    });

    targetLanguageSelect.addEventListener('change', (e) => {
        targetLanguage = e.target.value;
        updateTranslateButtonState();
    });

    sourceCodeTextarea.addEventListener('input', (e) => {
        sourceCode = e.target.value;
        updateTranslateButtonState();
    });

    translateButton.addEventListener('click', handleTranslate);
}

function updateTranslateButtonState() {
    const isValid = sourceLanguage && targetLanguage && (sourceCode || sourceCodeTextarea.value);
    translateButton.disabled = !isValid || isTranslating;
}

async function handleTranslate() {
  if (tabs[0].classList.contains('active')) {
    sourceCode = sourceCodeTextarea.value;
  }

  try {
    isTranslating = true;
    translateButton.disabled = true;
    translateButton.textContent = 'Translating...';

    console.log("Fetching responce to ", API_BASE, ENDPOINTS.translate);

    const response = await fetch(`${API_BASE}${ENDPOINTS.translate}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_code: sourceCode,
        source_lang: sourceLanguage,
        target_lang: targetLanguage
      })
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const blob = await response.blob();

    const zip = await JSZip.loadAsync(blob);
    zip.forEach(async (relativePath, file) => {
        const content = await file.async("string");

        if (relativePath.startsWith("hydra")){
            translatedCodeTextarea.value += relativePath;
            translatedCodeTextarea.value += content;
        }
        else if (relativePath.startsWith("genDSL")) translatedDSLArea.value = content;
        else if (relativePath.startsWith("parsedFiles")) parsedCodeArea.value += content;
        else if (!relativePath.startsWith("initialFile")){
            const fileData = await file.async("blob");
            const downloadLink = document.createElement("a");
            downloadLink.href = URL.createObjectURL(fileData);
            downloadLink.download = relativePath.split("/").pop();
            document.body.appendChild(downloadLink);
            downloadLink.click();
            downloadLink.remove();
        }
    });

    showMoreLink.hidden = false;

  } catch (err) {
    console.error('Ошибка запроса:', err);
    alert(err);
  } finally {
    isTranslating = false;
    translateButton.disabled = false;
    translateButton.innerHTML = 'Translate <span>→</span>';
  }
}

// Smooth scroll to translator section
function setupScrollToTranslator() {
    getStartedBtn.addEventListener('click', () => {
        document.getElementById('translator').scrollIntoView({ 
            behavior: 'smooth' 
        });
    });

    // Also handle navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            document.getElementById(targetId).scrollIntoView({ 
                behavior: 'smooth' 
            });
        });
    });
}

navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        navToggle.classList.toggle('active');
});

showMoreLink.addEventListener('click', () =>{
    translatedDSLArea.hidden = !translatedDSLArea.hidden;
    parsedCodeArea.hidden = !parsedCodeArea.hidden;
})
// Закрытие меню при клике на ссылку
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// Initialize the application
function init() {
    populateLanguageDropdowns();
    setupTabs();
    setupFileUpload();
    setupTranslation();
    setupScrollToTranslator();
}

// Run initialization when DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);