class CVEditor {
    constructor() {
        this.currentRole = 'backend';
        this.cvData = {};
        this.schema = {};
        this.template = '';
        this.validator = null;
        this.previewModal = null;
        this.generatedHTML = '';
        
        this.init();
    }

    // localStorage methods
    saveToStorage(key, data) {
        try {
            const storageKey = `cvgen_${key}`;
            localStorage.setItem(storageKey, JSON.stringify(data));
            
            // Show brief saving indicator for cvData
            if (key === 'cvData') {
                this.showSavingIndicator();
            }
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    }

    showSavingIndicator() {
        // Create or update saving indicator
        let indicator = document.getElementById('savingIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'savingIndicator';
            indicator.className = 'saving-indicator';
            indicator.innerHTML = '<i class="fas fa-save"></i> Saved';
            document.body.appendChild(indicator);
        }
        
        // Show and hide the indicator
        indicator.classList.add('show');
        clearTimeout(this.savingTimeout);
        this.savingTimeout = setTimeout(() => {
            indicator.classList.remove('show');
        }, 1500);
    }

    loadFromStorage(key) {
        try {
            const storageKey = `cvgen_${key}`;
            const data = localStorage.getItem(storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn('Failed to load from localStorage:', error);
            return null;
        }
    }

    async init() {
        this.setupEventListeners();
        
        // Initialize preview button state
        const openPreviewBtn = document.getElementById('openPreviewBtn');
        openPreviewBtn.disabled = true;
        openPreviewBtn.innerHTML = '<i class="fas fa-clock"></i> Loading...';
        
        // Try to restore saved role from localStorage
        const savedRole = this.loadFromStorage('currentRole');
        if (savedRole) {
            this.currentRole = savedRole;
            document.getElementById('roleSelect').value = savedRole;
        }
        
        await this.loadRole(this.currentRole);
        this.generateForm();
        
        // Try to restore saved CV data from localStorage
        const savedData = this.loadFromStorage('cvData');
        if (savedData) {
            this.cvData = { ...this.cvData, ...savedData };
            this.updateFormFromData();
        }
        
        this.updateJSON();
        this.generatePreview();
    }

    setupEventListeners() {
        // Role selector
        document.getElementById('roleSelect').addEventListener('change', (e) => {
            this.saveToStorage('currentRole', e.target.value);
            this.loadRole(e.target.value);
        });

        // View toggle
        document.getElementById('toggleView').addEventListener('click', () => {
            this.toggleView();
        });

        // View toggle from JSON panel
        document.getElementById('toggleViewFromJson').addEventListener('click', () => {
            this.toggleView();
        });

        // JSON editor
        document.getElementById('jsonEditor').addEventListener('input', (e) => {
            this.updateFromJSON(e.target.value);
        });

        // Format JSON
        document.getElementById('formatJson').addEventListener('click', () => {
            this.formatJSON();
        });

        // Open full preview
        document.getElementById('openPreviewBtn').addEventListener('click', () => {
            this.openFullPreview();
        });

        // Refresh preview
        document.getElementById('refreshPreview').addEventListener('click', () => {
            this.generatePreview();
        });

        // Validate
        document.getElementById('validateBtn').addEventListener('click', () => {
            this.validateData();
        });

        // Download
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadJSON();
        });

        // Load file
        document.getElementById('loadFileBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.loadFile(e.target.files[0]);
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.previewModal && this.previewModal.classList.contains('show')) {
                this.closeFullPreview();
            }
        });
    }

    async loadRole(role) {
        this.currentRole = role;
        
        try {
            // Load cv-schema once and use for both schema and data
            const cvSchemaResponse = await fetch(`./cv-data/${role}/cv-schema.json`);
            if (!cvSchemaResponse.ok) {
                throw new Error(`Failed to load data: ${cvSchemaResponse.status}`);
            }
            const cvData = await cvSchemaResponse.json();
            
            // Set both schema and data from the same response
            this.schema = cvData;
            this.cvData = cvData;
            
            // Load template (only once, cache it)
            if (!this.template) {
                const templateResponse = await fetch('./cv-templates/template-1.html');
                if (!templateResponse.ok) {
                    throw new Error(`Failed to load template: ${templateResponse.status}`);
                }
                this.template = await templateResponse.text();
            }
            
            // Skip validation for now - focus on core functionality
            this.validator = null;

            
            // Update UI
            this.generateForm();
            this.updateFormFromData();
            this.updateJSON();
            this.generatePreview();
            
        } catch (error) {
            console.error('Error loading role data:', error.message);
            this.showValidationMessage(`Error loading role data: ${error.message}`, 'error');
        }
    }

    generateForm() {
        const formEditor = document.getElementById('formEditor');
        formEditor.innerHTML = '';

        // Generate form based on schema
        const sections = this.getFormSections();
        
        sections.forEach(section => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'form-section';
            
            const sectionTitle = document.createElement('h4');
            sectionTitle.textContent = section.title;
            sectionDiv.appendChild(sectionTitle);
            
            section.fields.forEach(field => {
                const fieldDiv = this.createFormField(field);
                sectionDiv.appendChild(fieldDiv);
            });
            
            formEditor.appendChild(sectionDiv);
        });

        // Add event listeners to form fields
        this.addFormEventListeners();
    }

    getFormSections() {
        const sections = [];
        
        // Personal Information
        sections.push({
            title: 'Personal Information',
            fields: [
                { name: 'personal_info.name', label: 'Full Name', type: 'text', required: true },
                { name: 'personal_info.position', label: 'Position', type: 'text', required: true },
                { name: 'personal_info.email', label: 'Email', type: 'email', required: true },
                { name: 'personal_info.phone', label: 'Phone', type: 'text' },
                { name: 'personal_info.location', label: 'Location', type: 'text' },
                { name: 'personal_info.linkedin', label: 'LinkedIn', type: 'url' },
                { name: 'personal_info.github', label: 'GitHub', type: 'url' },
                { name: 'personal_info.portfolio', label: 'Portfolio', type: 'url' }
            ]
        });

        // Summary
        sections.push({
            title: 'Professional Summary',
            fields: [
                { name: 'summary.professional_summary', label: 'Summary', type: 'textarea', help: '2-3 sentences about your background and career goals' }
            ]
        });

        // Experience
        sections.push({
            title: 'Work Experience',
            fields: [
                { name: 'experience', label: 'Experience (JSON array)', type: 'textarea', help: 'Enter as JSON array of experience objects' }
            ]
        });

        // Education
        sections.push({
            title: 'Education',
            fields: [
                { name: 'education', label: 'Education (JSON array)', type: 'textarea', help: 'Enter as JSON array of education objects' }
            ]
        });

        // Skills
        sections.push({
            title: 'Skills',
            fields: [
                { name: 'skills', label: 'Skills (JSON object)', type: 'textarea', help: 'Enter as JSON object with skill categories' }
            ]
        });

        // Projects
        sections.push({
            title: 'Projects',
            fields: [
                { name: 'projects', label: 'Projects (JSON array)', type: 'textarea', help: 'Enter as JSON array of project objects' }
            ]
        });

        // Certifications
        sections.push({
            title: 'Certifications',
            fields: [
                { name: 'certifications', label: 'Certifications (JSON array)', type: 'textarea', help: 'Enter as JSON array of certification objects' }
            ]
        });

        // Languages
        sections.push({
            title: 'Languages',
            fields: [
                { name: 'languages', label: 'Languages (JSON array)', type: 'textarea', help: 'Enter as JSON array of language objects' }
            ]
        });

        return sections;
    }

    createFormField(field) {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = field.label;
        if (field.required) {
            label.innerHTML += ' <span style="color: red;">*</span>';
        }
        fieldDiv.appendChild(label);
        
        let input;
        if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 4;
        } else {
            input = document.createElement('input');
            input.type = field.type;
        }
        
        input.className = 'form-control';
        input.name = field.name;
        input.dataset.field = field.name;
        
        // Set value from current data (handle nested fields)
        const fieldValue = this.getNestedValue(this.cvData, field.name);
        if (fieldValue !== undefined) {
            if (typeof fieldValue === 'object') {
                input.value = JSON.stringify(fieldValue, null, 2);
            } else {
                input.value = fieldValue;
            }
        }
        
        fieldDiv.appendChild(input);
        
        if (field.help) {
            const helpText = document.createElement('small');
            helpText.style.color = '#6c757d';
            helpText.textContent = field.help;
            fieldDiv.appendChild(helpText);
        }
        
        return fieldDiv;
    }

    addFormEventListeners() {
        const formFields = document.querySelectorAll('.form-control');
        formFields.forEach(field => {
            field.addEventListener('input', (e) => {
                this.updateDataFromForm(e.target);
            });
        });
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key]) {
                current[key] = {};
            }
            return current[key];
        }, obj);
        target[lastKey] = value;
    }

    updateDataFromForm(field) {
        const fieldName = field.dataset.field;
        let value = field.value;
        
        // Try to parse JSON for complex fields
        if (field.tagName === 'TEXTAREA' && !fieldName.includes('.')) {
            try {
                value = JSON.parse(field.value);
            } catch (e) {
                // Keep as string if parsing fails
            }
        }
        
        this.setNestedValue(this.cvData, fieldName, value);
        
        // Save to localStorage whenever data changes
        this.saveToStorage('cvData', this.cvData);
        
        this.updateJSON();
        this.generatePreview();
    }

    updateJSON() {
        const jsonEditor = document.getElementById('jsonEditor');
        jsonEditor.value = JSON.stringify(this.cvData, null, 2);
    }

    updateFromJSON(jsonText) {
        try {
            const newData = JSON.parse(jsonText);
            this.cvData = newData;
            
            // Save to localStorage whenever JSON is updated
            this.saveToStorage('cvData', this.cvData);
            
            this.updateFormFromData();
            this.generatePreview();
        } catch (e) {
            // Invalid JSON, don't update
            this.showValidationMessage('❌ Invalid JSON format', 'error');
        }
    }

    updateFormFromData() {
        const formFields = document.querySelectorAll('.form-control');
        formFields.forEach(field => {
            const fieldName = field.dataset.field;
            const fieldValue = this.getNestedValue(this.cvData, fieldName);
            if (fieldValue !== undefined) {
                if (typeof fieldValue === 'object') {
                    field.value = JSON.stringify(fieldValue, null, 2);
                } else {
                    field.value = fieldValue;
                }
            }
        });
    }

    toggleView() {
        const formPanel = document.getElementById('formPanel');
        const jsonPanel = document.getElementById('jsonPanel');
        const toggleBtn = document.getElementById('toggleView');
        
        if (jsonPanel.style.display === 'none' || jsonPanel.style.display === '') {
            // Switch to JSON View
            formPanel.style.display = 'none';
            jsonPanel.style.display = 'flex';
            toggleBtn.innerHTML = '<i class="fas fa-edit"></i> Form View';
        } else {
            // Switch to Form View
            formPanel.style.display = 'flex';
            jsonPanel.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fas fa-code"></i> JSON View';
        }
    }

    formatJSON() {
        const jsonEditor = document.getElementById('jsonEditor');
        try {
            const parsed = JSON.parse(jsonEditor.value);
            jsonEditor.value = JSON.stringify(parsed, null, 2);
        } catch (e) {
            this.showValidationMessage('Invalid JSON format', 'error');
        }
    }

    generatePreview() {
        // Update the button state
        const openPreviewBtn = document.getElementById('openPreviewBtn');
        const previewContainer = document.getElementById('previewContainer');
        
        // Check if we have meaningful data to preview
        const hasData = this.cvData && (
            (this.cvData.personal_info && (this.cvData.personal_info.name || this.cvData.personal_info.email)) ||
            (this.cvData.work_experience && this.cvData.work_experience.length > 0) ||
            (this.cvData.education && this.cvData.education.length > 0) ||
            (this.cvData.skills && this.cvData.skills.length > 0)
        );
        
        if (!hasData) {
            // Show placeholder when no meaningful data
            openPreviewBtn.disabled = true;
            openPreviewBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Data to Preview';
            
            previewContainer.innerHTML = `
                <div class="preview-placeholder">
                    <i class="fas fa-file-alt"></i>
                    <p>Fill in your CV information to see live preview</p>
                    <small>Your CV will appear here automatically as you type</small>
                </div>
            `;
            return;
        }
        
        try {
            // Register Handlebars helpers only once
            if (!Handlebars.helpers.join) {
                Handlebars.registerHelper('join', function(array) {
                    if (!array || !Array.isArray(array)) return '';
                    return array.join(', ');
                });
            }
            
            // Compile template
            const template = Handlebars.compile(this.template);
            
            // Generate HTML
            this.generatedHTML = template(this.cvData);
            
            // Enable the preview button
            openPreviewBtn.disabled = false;
            openPreviewBtn.innerHTML = '<i class="fas fa-external-link-alt"></i> Open Full Preview';
            
            // Show live preview in the container with iframe to prevent style conflicts
            previewContainer.innerHTML = `
                <div class="live-preview-wrapper">
                    <div class="preview-header">
                        <span class="preview-label">
                            <i class="fas fa-eye"></i> Live Preview
                        </span>
                        <small class="preview-hint">Click "Open Full Preview" for downloads and better viewing</small>
                    </div>
                    <iframe 
                        id="livePreviewFrame" 
                        class="live-preview-iframe"
                        srcdoc="${this.generatedHTML.replace(/"/g, '&quot;')}"
                    ></iframe>
                </div>
            `;
            
        } catch (error) {
            // Disable the preview button on error
            openPreviewBtn.disabled = true;
            openPreviewBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Preview Error';
            
            previewContainer.innerHTML = `
                <div class="preview-placeholder">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error generating preview</p>
                    <small>${error.message}</small>
                </div>
            `;
        }
    }

    validateData() {
        const messages = document.getElementById('validationMessages');
        messages.innerHTML = '';
        
        // Simple validation without Ajv
        const errors = [];
        
        if (!this.cvData.personal_info || !this.cvData.personal_info.name) {
            errors.push('Name is required');
        }
        
        if (!this.cvData.personal_info || !this.cvData.personal_info.email) {
            errors.push('Email is required');
        }
        
        if (errors.length === 0) {
            this.showValidationMessage('✅ CV data looks good!', 'success');
        } else {
            errors.forEach(error => {
                this.showValidationMessage(`❌ ${error}`, 'error');
            });
        }
    }

    showValidationMessage(message, type) {
        const messages = document.getElementById('validationMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `validation-${type}`;
        messageDiv.textContent = message;
        messages.appendChild(messageDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    downloadJSON() {
        const jsonData = JSON.stringify(this.cvData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const filename = `cv-${this.currentRole}-${new Date().toISOString().split('T')[0]}.json`;
        
        saveAs(blob, filename);
    }

    async loadFile(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            this.cvData = data;
            
            // Save loaded data to localStorage
            this.saveToStorage('cvData', this.cvData);
            
            this.updateFormFromData();
            this.updateJSON();
            this.generatePreview();
            
            this.showValidationMessage('✅ File loaded successfully!', 'success');
        } catch (error) {
            this.showValidationMessage('❌ Error loading file: ' + error.message, 'error');
        }
    }

    createPreviewModal() {
        if (this.previewModal) {
            return this.previewModal;
        }

        const modal = document.createElement('div');
        modal.className = 'preview-modal';
        modal.innerHTML = `
            <div class="preview-modal-content">
                <div class="preview-modal-header">
                    <h3>
                        <i class="fas fa-file-alt"></i>
                        CV Preview
                    </h3>
                    <div class="preview-modal-actions">
                        <button id="modalDownloadPdfBtn" class="btn btn-pdf">
                            <i class="fas fa-file-pdf"></i> PDF
                        </button>
                        <button id="modalDownloadHtmlBtn" class="btn btn-html">
                            <i class="fas fa-file-code"></i> HTML
                        </button>
                        <button id="modalDownloadDocBtn" class="btn btn-doc">
                            <i class="fas fa-file-word"></i> DOC
                        </button>
                        <button id="openInNewTabBtn" class="btn btn-secondary">
                            <i class="fas fa-external-link-alt"></i> New Tab
                        </button>
                        <button class="close-preview">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="preview-modal-body">
                    <iframe class="preview-iframe" id="previewIframe"></iframe>
                </div>
            </div>
        `;

        // Add event listeners
        modal.querySelector('.close-preview').addEventListener('click', () => {
            this.closeFullPreview();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeFullPreview();
            }
        });

        modal.querySelector('#modalDownloadPdfBtn').addEventListener('click', () => {
            this.downloadAsPDF();
        });

        modal.querySelector('#modalDownloadHtmlBtn').addEventListener('click', () => {
            this.downloadAsHTML();
        });

        modal.querySelector('#modalDownloadDocBtn').addEventListener('click', () => {
            this.downloadAsDoc();
        });

        modal.querySelector('#openInNewTabBtn').addEventListener('click', () => {
            this.openInNewTab();
        });

        document.body.appendChild(modal);
        this.previewModal = modal;
        return modal;
    }

    openFullPreview() {
        if (!this.generatedHTML) {
            this.showValidationMessage('❌ No CV data to preview. Please fill in your information first.', 'error');
            return;
        }

        const modal = this.createPreviewModal();
        const iframe = modal.querySelector('#previewIframe');
        
        // Set the HTML content to the iframe
        iframe.srcdoc = this.generatedHTML;
        
        // Show the modal
        modal.classList.add('show');
        
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    }

    closeFullPreview() {
        if (this.previewModal) {
            this.previewModal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    downloadAsHTML() {
        if (!this.generatedHTML) {
            this.showValidationMessage('❌ No CV data to download.', 'error');
            return;
        }

        // Create a temporary link to download HTML
        const blob = new Blob([this.generatedHTML], { type: 'text/html' });
        const filename = `cv-${this.currentRole}-${new Date().toISOString().split('T')[0]}.html`;
        
        saveAs(blob, filename);
        
        this.showValidationMessage('📄 CV downloaded as HTML. Open in your browser and use "Print to PDF" to create a PDF version.', 'success');
    }

    openInNewTab() {
        if (!this.generatedHTML) {
            this.showValidationMessage('❌ No CV data to open.', 'error');
            return;
        }

        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.open();
            newWindow.document.write(this.generatedHTML);
            newWindow.document.close();
            newWindow.document.title = `CV Preview - ${this.cvData.personal_info?.name || 'Unknown'}`;
        } else {
            this.showValidationMessage('❌ Popup blocked. Please allow popups for this site.', 'error');
        }
    }

    downloadAsPDF() {
        if (!this.generatedHTML) {
            this.showValidationMessage('❌ No CV data to download.', 'error');
            return;
        }

        // Create a new window with the CV content for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            // Enhanced HTML with print styles
            const printHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>CV - ${this.cvData.personal_info?.name || 'Download'}</title>
                    <style>
                        @media print {
                            body { margin: 0; padding: 20px; }
                            @page { margin: 1cm; size: A4; }
                        }
                        body { font-family: Arial, sans-serif; line-height: 1.4; }
                    </style>
                </head>
                <body>
                    ${this.generatedHTML.replace(/<html[^>]*>|<\/html>|<head[^>]*>.*?<\/head>|<body[^>]*>|<\/body>/gi, '')}
                </body>
                </html>
            `;
            
            printWindow.document.open();
            printWindow.document.write(printHTML);
            printWindow.document.close();
            
            // Trigger print dialog
            setTimeout(() => {
                printWindow.print();
                this.showValidationMessage('📄 Print dialog opened. Choose "Save as PDF" in the print options.', 'success');
            }, 500);
        } else {
            this.showValidationMessage('❌ Popup blocked. Please allow popups to download PDF.', 'error');
        }
    }

    downloadAsDoc() {
        if (!this.generatedHTML) {
            this.showValidationMessage('❌ No CV data to download.', 'error');
            return;
        }

        // Create DOC-compatible HTML
        const docHTML = `
            <!DOCTYPE html>
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
            <head>
                <meta charset='utf-8'>
                <title>CV - ${this.cvData.personal_info?.name || 'Download'}</title>
                <!--[if gte mso 9]>
                <xml>
                    <w:WordDocument>
                        <w:View>Print</w:View>
                        <w:Zoom>90</w:Zoom>
                        <w:DoNotPromptForConvert/>
                        <w:DoNotAutofitConstrainedTables/>
                    </w:WordDocument>
                </xml>
                <![endif]-->
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.4; margin: 20px; }
                    h1, h2, h3 { color: #333; }
                    .section { margin-bottom: 20px; }
                </style>
            </head>
            <body>
                ${this.generatedHTML.replace(/<html[^>]*>|<\/html>|<head[^>]*>.*?<\/head>|<body[^>]*>|<\/body>/gi, '')}
            </body>
            </html>
        `;

        const blob = new Blob([docHTML], { 
            type: 'application/msword'
        });
        
        const filename = `cv-${this.currentRole}-${new Date().toISOString().split('T')[0]}.doc`;
        saveAs(blob, filename);
        
        this.showValidationMessage('📄 CV downloaded as DOC file. You can open it with Microsoft Word.', 'success');
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CVEditor();
}); 