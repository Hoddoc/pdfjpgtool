/**
 * PDF Image Tool - Client-side PDF processing application
 * Converts PDF pages to images and extracts embedded images
 */

class PDFImageTool {
    constructor() {
        this.pdfDocument = null;
        this.currentFile = null;
        this.isProcessing = false;
        
        // File validation settings
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.allowedTypes = ['application/pdf'];
        this.allowedExtensions = ['.pdf'];
        
        // Cloud storage tokens
        this.cloudTokens = {
            dropbox: null,
            google: null
        };
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupPDFJS();
        this.setupCloudStorageListeners();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.elements = {
            uploadArea: document.getElementById('uploadArea'),
            pdfFile: document.getElementById('pdfFileInput'),
            fileInfo: document.getElementById('fileInfo'),
            fileName: document.getElementById('fileName'),
            removeFile: document.getElementById('removeFile'),
            convertPagesBtn: document.getElementById('convertPagesBtn'),
            extractImagesBtn: document.getElementById('extractImagesBtn'),
            progressSection: document.getElementById('progressSection'),
            progressBar: document.getElementById('progressBar'),
            progressText: document.getElementById('progressText'),
            statusMessage: document.getElementById('statusMessage'),
            resultsSection: document.getElementById('resultsSection'),
            downloadArea: document.getElementById('downloadArea'),
            alertContainer: document.getElementById('alertContainer')
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // File upload events
        this.elements.uploadArea.addEventListener('click', () => {
            this.elements.pdfFile.click();
        });

        // Handle the new select file button
        const selectFileBtn = document.getElementById('selectFileBtn');
        if (selectFileBtn) {
            selectFileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.elements.pdfFile.click();
            });
        }

        this.elements.pdfFile.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        this.elements.removeFile.addEventListener('click', () => {
            this.clearFile();
        });

        // Drag and drop events
        this.elements.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.uploadArea.classList.add('dragover');
        });

        this.elements.uploadArea.addEventListener('dragleave', () => {
            this.elements.uploadArea.classList.remove('dragover');
        });

        this.elements.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) {
                this.handleFileSelect(file);
            } else {
                this.showAlert('파일을 선택해주세요.', 'warning');
            }
        });

        // Processing buttons
        this.elements.convertPagesBtn.addEventListener('click', () => {
            if (!this.elements.convertPagesBtn.disabled) {
                this.convertPagesToImages('jpeg');
            }
        });

        this.elements.extractImagesBtn.addEventListener('click', () => {
            if (!this.elements.extractImagesBtn.disabled) {
                this.extractImages();
            }
        });

        // PNG conversion button
        const convertToPngBtn = document.getElementById('convertToPngBtn');
        if (convertToPngBtn) {
            convertToPngBtn.addEventListener('click', () => {
                if (!convertToPngBtn.disabled) {
                    this.convertPagesToImages('png');
                }
            });
        }

        // JPG to WebP conversion button
        const convertToWebpBtn = document.getElementById('convertToWebpBtn');
        if (convertToWebpBtn) {
            convertToWebpBtn.addEventListener('click', () => {
                if (!convertToWebpBtn.disabled) {
                    this.convertJpgToWebp();
                }
            });
        }

        // PDF to HWP conversion button
        const convertToHwpBtn = document.getElementById('convertToHwpBtn');
        if (convertToHwpBtn) {
            convertToHwpBtn.addEventListener('click', () => {
                if (!convertToHwpBtn.disabled) {
                    this.convertPdfToHwp();
                }
            });
        }

    }

    /**
     * Setup PDF.js configuration
     */
    setupPDFJS() {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            // Configure CMap settings to avoid warnings
            this.pdfConfig = {
                cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
                cMapPacked: true,
                enableXfa: false,
                standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/'
            };
        }
    }

    /**
     * Validate file before processing
     */
    validateFile(file) {
        const errors = [];
        
        // Check file type by MIME type
        if (!this.allowedTypes.includes(file.type)) {
            if (window.errorSystem) {
                window.errorSystem.showError('invalidFileType');
            }
            errors.push('PDF 파일만 업로드 가능합니다.');
        }
        
        // Check file extension as backup
        const fileName = file.name.toLowerCase();
        const hasValidExtension = this.allowedExtensions.some(ext => fileName.endsWith(ext));
        if (!hasValidExtension) {
            if (window.errorSystem) {
                window.errorSystem.showError('invalidFileType');
            }
            errors.push('파일 확장자가 올바르지 않습니다. .pdf 파일만 지원됩니다.');
        }
        
        // Check file size
        if (file.size > this.maxFileSize) {
            if (window.errorSystem) {
                window.errorSystem.showError('fileTooBig', { 
                    maxSize: Math.round(this.maxFileSize / (1024 * 1024)) 
                });
            }
            errors.push(`파일 크기가 너무 큽니다. 최대 ${this.formatFileSize(this.maxFileSize)}까지 지원됩니다.`);
        }
        
        // Check for empty file
        if (file.size === 0) {
            if (window.errorSystem) {
                window.errorSystem.showError('emptyFile');
            }
            errors.push('빈 파일은 업로드할 수 없습니다.');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Handle file selection
     */
    async handleFileSelect(file) {
        if (!file) return;

        // Clear previous alerts
        this.clearAlerts();

        // Validate file
        const validation = this.validateFile(file);
        if (!validation.isValid) {
            // Add error state to upload area
            this.elements.uploadArea.classList.add('error');
            setTimeout(() => {
                this.elements.uploadArea.classList.remove('error');
            }, 3000);
            
            validation.errors.forEach(error => {
                this.showAlert(error, 'warning');
            });
            return;
        }

        // Add success state to upload area
        this.elements.uploadArea.classList.add('success');
        
        this.currentFile = file;
        this.elements.fileName.textContent = `${file.name} (${this.formatFileSize(file.size)})`;
        this.elements.fileInfo.style.display = 'block';
        this.elements.uploadArea.style.display = 'none';

        // Show loading state
        if (window.errorSystem) {
            window.errorSystem.showError('loadingPdf', {}, 3000);
        }
        this.showAlert('PDF 파일을 로드 중입니다...', 'info');

        try {
            await this.loadPDF(file);
            this.enableProcessingButtons();
            this.clearAlerts();
            if (window.errorSystem) {
                window.errorSystem.showError('pdfLoadSuccess', { 
                    pageCount: this.pdfDocument.numPages 
                }, 3000);
            }
            this.showAlert(`PDF 로드 완료: ${this.pdfDocument.numPages}페이지`, 'success');
        } catch (error) {
            console.error('PDF 로드 오류:', error);
            this.clearAlerts();
            
            // Use new error system for specific error types
            if (error.message.includes('Invalid PDF')) {
                if (window.errorSystem) {
                    window.errorSystem.showError('corruptedPdf');
                }
            } else if (error.message.includes('password')) {
                if (window.errorSystem) {
                    window.errorSystem.showError('passwordProtectedPdf');
                }
            } else if (error.message.includes('fetch')) {
                if (window.errorSystem) {
                    window.errorSystem.showError('networkError');
                }
            } else {
                if (window.errorSystem) {
                    window.errorSystem.showError('pdfLoadError');
                }
            }
            
            this.clearFile();
        }
    }

    /**
     * Load PDF using PDF.js
     */
    async loadPDF(file) {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            ...this.pdfConfig
        });
        this.pdfDocument = await loadingTask.promise;
    }

    /**
     * Clear selected file
     */
    clearFile() {
        this.currentFile = null;
        this.pdfDocument = null;
        this.elements.pdfFile.value = '';
        this.elements.fileInfo.style.display = 'none';
        this.elements.uploadArea.style.display = 'block';
        this.elements.progressSection.style.display = 'none';
        this.elements.resultsSection.style.display = 'none';
        
        // Reset validation states
        this.elements.uploadArea.classList.remove('error', 'success', 'dragover');
        
        this.disableProcessingButtons();
        this.clearAlerts();
    }

    /**
     * Enable processing buttons
     */
    enableProcessingButtons() {
        this.elements.convertPagesBtn.disabled = false;
        this.elements.extractImagesBtn.disabled = false;
        
        const convertToPngBtn = document.getElementById('convertToPngBtn');
        if (convertToPngBtn) {
            convertToPngBtn.disabled = false;
        }
        
        const convertToWebpBtn = document.getElementById('convertToWebpBtn');
        if (convertToWebpBtn) {
            convertToWebpBtn.disabled = false;
        }

        const convertToHwpBtn = document.getElementById('convertToHwpBtn');
        if (convertToHwpBtn) {
            convertToHwpBtn.disabled = false;
        }
    }

    /**
     * Disable processing buttons
     */
    disableProcessingButtons() {
        this.elements.convertPagesBtn.disabled = true;
        this.elements.extractImagesBtn.disabled = true;
        
        const convertToPngBtn = document.getElementById('convertToPngBtn');
        if (convertToPngBtn) {
            convertToPngBtn.disabled = true;
        }
        
        const convertToWebpBtn = document.getElementById('convertToWebpBtn');
        if (convertToWebpBtn) {
            convertToWebpBtn.disabled = true;
        }

        const convertToHwpBtn = document.getElementById('convertToHwpBtn');
        if (convertToHwpBtn) {
            convertToHwpBtn.disabled = true;
        }
    }

    /**
     * Convert PDF pages to images
     */
    async convertPagesToImages(format = 'jpeg') {
        if (!this.pdfDocument || this.isProcessing) return;

        this.isProcessing = true;
        this.showProgress();
        this.hideResults();

        try {
            const zip = new JSZip();
            const numPages = this.pdfDocument.numPages;
            let mimeType, extension, formatName;
            
            if (format === 'png') {
                mimeType = 'image/png';
                extension = 'png';
                formatName = 'PNG';
            } else if (format === 'webp') {
                mimeType = 'image/webp';
                extension = 'webp';
                formatName = 'WebP';
            } else {
                mimeType = 'image/jpeg';
                extension = 'jpg';
                formatName = 'JPG';
            }

            this.updateStatus(`PDF 페이지를 ${formatName}로 변환 중...`);

            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                this.updateProgress((pageNum - 1) / numPages * 100, `페이지 ${pageNum}/${numPages} ${formatName}로 변환 중...`);

                const page = await this.pdfDocument.getPage(pageNum);
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                // Set appropriate scale for good quality
                const scale = 2.0;
                const viewport = page.getViewport({ scale });

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };

                await page.render(renderContext).promise;

                // Convert canvas to blob with specified format
                const blob = await new Promise(resolve => {
                    if (format === 'png') {
                        canvas.toBlob(resolve, mimeType);
                    } else if (format === 'webp') {
                        canvas.toBlob(resolve, mimeType, 0.85);
                    } else {
                        canvas.toBlob(resolve, mimeType, 0.90);
                    }
                });

                zip.file(`page-${pageNum.toString().padStart(3, '0')}.${extension}`, blob);
            }

            this.updateProgress(100, 'ZIP 파일 생성 중...');
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            this.showDownload(zipBlob, `${this.getFileNameWithoutExt()}_${format}_pages.zip`, numPages, 'pages');
            this.updateStatus(`${formatName} 변환 완료!`);

        } catch (error) {
            console.error('페이지 변환 오류:', error);
            if (window.errorSystem) {
                window.errorSystem.showError('conversionFailed', { format: formatName });
            }
            this.showAlert('페이지 변환 중 오류가 발생했습니다.', 'danger');
            this.hideProgress();
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Extract embedded images from PDF
     */
    async extractImages() {
        if (!this.pdfDocument || this.isProcessing) return;

        this.isProcessing = true;
        this.showProgress();
        this.hideResults();

        try {
            const zip = new JSZip();
            const numPages = this.pdfDocument.numPages;
            let totalImages = 0;

            this.updateStatus('PDF에서 이미지 추출 중...');

            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                this.updateProgress((pageNum - 1) / numPages * 100, `페이지 ${pageNum}/${numPages} 분석 중...`);

                const page = await this.pdfDocument.getPage(pageNum);
                const operatorList = await page.getOperatorList();
                const images = await this.extractImagesFromPage(page, pageNum);

                for (let i = 0; i < images.length; i++) {
                    const imageBlob = images[i];
                    const imageName = `image-page${pageNum}-${i + 1}.png`;
                    zip.file(imageName, imageBlob);
                    totalImages++;
                }
            }

            if (totalImages === 0) {
                if (window.errorSystem) {
                    window.errorSystem.showError('noImagesFound');
                }
                this.showAlert('PDF에서 추출할 수 있는 이미지를 찾지 못했습니다.', 'warning');
                this.hideProgress();
                return;
            }

            this.updateProgress(100, 'ZIP 파일 생성 중...');
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            this.showDownload(zipBlob, `${this.getFileNameWithoutExt()}_images.zip`, totalImages, 'images');
            this.updateStatus(`이미지 추출 완료! (${totalImages}개 이미지)`);

        } catch (error) {
            console.error('이미지 추출 오류:', error);
            if (window.errorSystem) {
                window.errorSystem.showError('imageExtractionFailed');
            }
            this.showAlert('이미지 추출 중 오류가 발생했습니다.', 'danger');
            this.hideProgress();
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Extract images from a specific page
     */
    async extractImagesFromPage(page, pageNum) {
        const images = [];
        
        try {
            const operatorList = await page.getOperatorList();
            const resources = await page.objs;

            // Look for image operations in the operator list
            for (let i = 0; i < operatorList.fnArray.length; i++) {
                const operator = operatorList.fnArray[i];
                
                // Check for image painting operations
                if (operator === pdfjsLib.OPS.paintImageXObject || 
                    operator === pdfjsLib.OPS.paintInlineImageXObject ||
                    operator === pdfjsLib.OPS.paintImageMaskXObject) {
                    
                    const args = operatorList.argsArray[i];
                    if (args && args.length > 0) {
                        try {
                            // Try to extract the image using canvas rendering
                            const canvas = document.createElement('canvas');
                            const context = canvas.getContext('2d');
                            const scale = 1.5;
                            const viewport = page.getViewport({ scale });

                            canvas.height = viewport.height;
                            canvas.width = viewport.width;

                            const renderContext = {
                                canvasContext: context,
                                viewport: viewport
                            };

                            await page.render(renderContext).promise;

                            // Extract image data (this is a simplified approach)
                            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                            
                            // Convert to blob if we have valid image data
                            if (imageData && imageData.data.length > 0) {
                                const blob = await new Promise(resolve => {
                                    canvas.toBlob(resolve, 'image/png', 0.95);
                                });
                                
                                if (blob && blob.size > 1000) { // Only include if substantial size
                                    images.push(blob);
                                }
                            }
                        } catch (imageError) {
                            console.warn(`페이지 ${pageNum}에서 이미지 추출 실패:`, imageError);
                        }
                    }
                }
            }
        } catch (error) {
            console.warn(`페이지 ${pageNum} 처리 중 오류:`, error);
        }

        return images;
    }

    /**
     * Convert JPG files to WebP format
     */
    async convertJpgToWebp() {
        if (this.isProcessing) return;

        // Create file input for JPG files
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/jpg';
        input.multiple = true;
        
        input.onchange = async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            this.isProcessing = true;
            this.showProgress();
            this.hideResults();

            try {
                const zip = new JSZip();
                const totalFiles = files.length;

                this.updateStatus('JPG 파일을 WebP로 변환 중...');

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    this.updateProgress((i / totalFiles) * 100, `${file.name} WebP로 변환 중... (${i + 1}/${totalFiles})`);

                    // Create canvas to process the image
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();

                    const webpBlob = await new Promise((resolve, reject) => {
                        img.onload = () => {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.drawImage(img, 0, 0);
                            
                            canvas.toBlob(resolve, 'image/webp', 0.85);
                        };
                        img.onerror = reject;
                        img.src = URL.createObjectURL(file);
                    });

                    const fileName = file.name.replace(/\.(jpg|jpeg)$/i, '.webp');
                    zip.file(fileName, webpBlob);
                    URL.revokeObjectURL(img.src);
                }

                this.updateProgress(100, 'ZIP 파일 생성 중...');
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                
                this.showDownload(zipBlob, 'converted_webp_images.zip', totalFiles, 'webp');
                this.updateStatus('WebP 변환 완료!');

            } catch (error) {
                console.error('WebP 변환 오류:', error);
                this.showAlert('WebP 변환 중 오류가 발생했습니다.', 'danger');
                this.hideProgress();
            } finally {
                this.isProcessing = false;
            }
        };

        input.click();
    }



    /**
     * Show progress section
     */
    showProgress() {
        this.elements.progressSection.style.display = 'block';
        this.updateProgress(0, '시작 중...');
    }

    /**
     * Hide progress section
     */
    hideProgress() {
        this.elements.progressSection.style.display = 'none';
    }

    /**
     * Update progress bar and status
     */
    updateProgress(percentage, status) {
        const roundedPercentage = Math.round(percentage);
        this.elements.progressBar.style.width = `${roundedPercentage}%`;
        this.elements.progressText.textContent = `${roundedPercentage}%`;
        
        if (status) {
            this.updateStatus(status);
        }
    }

    /**
     * Update status message
     */
    updateStatus(message) {
        this.elements.statusMessage.innerHTML = `<i data-feather="activity" class="me-2"></i>${message}`;
        feather.replace();
    }

    /**
     * Show download section
     */
    showDownload(blob, filename, count, type) {
        const url = URL.createObjectURL(blob);
        const size = this.formatFileSize(blob.size);
        const typeText = type === 'pages' ? '페이지' : type === 'HWP 호환 문서' ? '문서' : '이미지';

        // Check for connected cloud services
        const dropboxConnected = localStorage.getItem('dropbox_token');
        const driveConnected = localStorage.getItem('drive_token');
        const onedriveConnected = localStorage.getItem('onedrive_token');

        let cloudButtons = '';
        if (dropboxConnected || driveConnected || onedriveConnected) {
            cloudButtons = `
                <div class="d-flex flex-wrap gap-1 mt-2 justify-content-end">
                    ${dropboxConnected ? `<button class="btn btn-sm" style="background: #0061ff; color: white; border: 1px solid #0061ff;" onclick="saveToCloud('dropbox', '${filename}')" title="Dropbox에 저장">
                        <i data-feather="cloud" style="width: 14px; height: 14px;" class="me-1"></i>Dropbox
                    </button>` : ''}
                    ${driveConnected ? `<button class="btn btn-sm" style="background: #4285f4; color: white; border: 1px solid #4285f4;" onclick="saveToCloud('googledrive', '${filename}')" title="Google Drive에 저장">
                        <i data-feather="hard-drive" style="width: 14px; height: 14px;" class="me-1"></i>Drive
                    </button>` : ''}
                    ${onedriveConnected ? `<button class="btn btn-sm" style="background: #0078d4; color: white; border: 1px solid #0078d4;" onclick="saveToCloud('onedrive', '${filename}')" title="OneDrive에 저장">
                        <i data-feather="cloud" style="width: 14px; height: 14px;" class="me-1"></i>OneDrive
                    </button>` : ''}
                </div>
            `;
        }

        this.elements.downloadArea.innerHTML = `
            <div class="download-item">
                <div class="download-info">
                    <i data-feather="archive" class="text-primary" size="24"></i>
                    <div>
                        <div class="fw-bold">${filename}</div>
                        <div class="download-meta">${count}개 ${typeText} • ${size}</div>
                    </div>
                </div>
                <div class="d-flex flex-column align-items-end">
                    <a href="${url}" download="${filename}" class="btn btn-success">
                        <i data-feather="download" size="16" class="me-1"></i>
                        다운로드
                    </a>
                    ${cloudButtons}
                </div>
            </div>
        `;

        this.elements.resultsSection.style.display = 'block';
        feather.replace();

        // Store blob for cloud upload
        this.currentDownloadBlob = blob;

        // Auto cleanup URL after 10 minutes
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 600000);
    }

    /**
     * Hide results section
     */
    hideResults() {
        this.elements.resultsSection.style.display = 'none';
    }

    /**
     * Show alert message
     */
    showAlert(message, type = 'info') {
        const alertId = 'alert_' + Date.now();
        const alertClass = `alert-${type}`;
        const icon = this.getAlertIcon(type);

        const alertHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert" id="${alertId}">
                <i data-feather="${icon}" size="16" class="me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        this.elements.alertContainer.insertAdjacentHTML('beforeend', alertHTML);
        feather.replace();

        // Auto remove after 5 seconds
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                const alert = new bootstrap.Alert(alertElement);
                alert.close();
            }
        }, 5000);
    }

    /**
     * Clear all alerts
     */
    clearAlerts() {
        this.elements.alertContainer.innerHTML = '';
    }

    /**
     * Get appropriate icon for alert type
     */
    getAlertIcon(type) {
        const icons = {
            success: 'check-circle',
            danger: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        };
        return icons[type] || 'info';
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get filename without extension
     */
    getFileNameWithoutExt() {
        if (!this.currentFile) return 'document';
        const name = this.currentFile.name;
        const lastDotIndex = name.lastIndexOf('.');
        return lastDotIndex > 0 ? name.substring(0, lastDotIndex) : name;
    }

    /**
     * Convert PDF to HWP (RTF format compatible with Hancom Office)
     */
    async convertPdfToHwp() {
        if (!this.pdfDocument || this.isProcessing) return;

        this.isProcessing = true;
        this.showProgress();
        this.updateProgress(0, 'PDF 텍스트 추출 중...');

        try {
            let allText = '';
            const numPages = this.pdfDocument.numPages;

            // Extract text from each page
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                this.updateProgress((pageNum - 1) / numPages * 80, `페이지 ${pageNum}/${numPages} 텍스트 추출 중...`);
                
                const page = await this.pdfDocument.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                // Combine text items with proper spacing
                let pageText = '';
                let lastY = null;
                
                textContent.items.forEach(item => {
                    // Add line breaks for new lines (different Y coordinates)
                    if (lastY !== null && Math.abs(lastY - item.transform[5]) > 5) {
                        pageText += '\n';
                    }
                    
                    pageText += item.str + ' ';
                    lastY = item.transform[5];
                });

                // Add page break between pages
                if (pageNum > 1) {
                    allText += '\n\n--- 페이지 ' + pageNum + ' ---\n\n';
                }
                allText += pageText.trim();
            }

            this.updateProgress(85, 'RTF 문서 생성 중...');

            // Create RTF content (Rich Text Format - compatible with HWP/한글)
            const rtfContent = this.createRTFDocument(allText);

            this.updateProgress(95, '파일 준비 중...');

            // Create blob and download
            const blob = new Blob([rtfContent], { type: 'application/rtf' });
            const filename = `${this.getFileNameWithoutExt()}.rtf`;

            this.updateProgress(100, '변환 완료!');
            
            // Show download section
            this.showDownload(blob, filename, 1, 'HWP 호환 문서');

        } catch (error) {
            console.error('PDF to HWP conversion error:', error);
            this.showAlert('HWP 변환 중 오류가 발생했습니다: ' + error.message, 'danger');
        } finally {
            this.isProcessing = false;
            setTimeout(() => {
                this.hideProgress();
            }, 1000);
        }
    }

    /**
     * Create RTF document content
     */
    createRTFDocument(text) {
        // RTF header with Korean font support
        const rtfHeader = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}{\\f1 \\fcharset129 맑은 고딕;}}`;
        
        // Document formatting
        const docFormat = `\\f1\\fs22\\lang1042`; // Use Korean font, size 11pt, Korean language
        
        // Escape special RTF characters
        const escapedText = text
            .replace(/\\/g, '\\\\')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}')
            .replace(/\n/g, '\\par\n');
        
        // RTF footer
        const rtfFooter = '}';
        
        return rtfHeader + docFormat + ' ' + escapedText + rtfFooter;
    }

    /**
     * Setup cloud storage event listeners
     */
    setupCloudStorageListeners() {
        // Listen for OAuth responses
        window.addEventListener('message', (event) => {
            if (event.origin !== window.location.origin) return;
            
            const { type, token, account_id, refresh_token, error } = event.data;
            
            if (type === 'dropbox_auth_success') {
                this.cloudTokens.dropbox = token;
                this.updateCloudStorageStatus('dropbox', true);
                if (window.errorSystem) {
                    window.errorSystem.showError('cloudStorageConnected', { service: 'Dropbox' }, 3000);
                }
            } else if (type === 'google_auth_success') {
                this.cloudTokens.google = token;
                this.updateCloudStorageStatus('google', true);
                if (window.errorSystem) {
                    window.errorSystem.showError('cloudStorageConnected', { service: 'Google Drive' }, 3000);
                }
            } else if (type.includes('auth_error')) {
                const service = type.includes('dropbox') ? 'Dropbox' : 'Google Drive';
                if (window.errorSystem) {
                    window.errorSystem.showError('cloudStorageError');
                }
                console.error(`${service} authentication error:`, error);
            }
        });
    }

    /**
     * Update cloud storage connection status in UI
     */
    updateCloudStorageStatus(service, isConnected) {
        const statusElement = document.getElementById(`${service}Status`);
        if (statusElement) {
            statusElement.textContent = isConnected ? 'Connected' : 'Not Connected';
            statusElement.className = isConnected ? 'text-success' : 'text-muted';
        }
    }

    /**
     * Connect to Dropbox
     */
    connectDropbox() {
        const popup = window.open('/auth/dropbox', 'dropbox_auth', 'width=600,height=600');
        const checkClosed = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkClosed);
            }
        }, 1000);
    }

    /**
     * Connect to Google Drive
     */
    connectGoogleDrive() {
        const popup = window.open('/auth/google', 'google_auth', 'width=600,height=600');
        const checkClosed = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkClosed);
            }
        }, 1000);
    }

    /**
     * Upload file to Dropbox
     */
    async uploadToDropbox(blob, filename) {
        if (!this.cloudTokens.dropbox) {
            if (window.errorSystem) {
                window.errorSystem.showError('cloudStorageError');
            }
            return false;
        }

        try {
            const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.cloudTokens.dropbox}`,
                    'Dropbox-API-Arg': JSON.stringify({
                        path: `/${filename}`,
                        mode: 'add',
                        autorename: true
                    }),
                    'Content-Type': 'application/octet-stream'
                },
                body: blob
            });

            if (response.ok) {
                const result = await response.json();
                return result;
            } else {
                throw new Error(`Upload failed: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Dropbox upload error:', error);
            if (window.errorSystem) {
                window.errorSystem.showError('cloudStorageError');
            }
            return false;
        }
    }

    /**
     * Upload file to Google Drive
     */
    async uploadToGoogleDrive(blob, filename) {
        if (!this.cloudTokens.google) {
            if (window.errorSystem) {
                window.errorSystem.showError('cloudStorageError');
            }
            return false;
        }

        try {
            // Create form data for multipart upload
            const metadata = {
                name: filename
            };

            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
            formData.append('file', blob);

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.cloudTokens.google}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                return result;
            } else {
                throw new Error(`Upload failed: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Google Drive upload error:', error);
            if (window.errorSystem) {
                window.errorSystem.showError('cloudStorageError');
            }
            return false;
        }
    }
}

// Global function for guide toggle - defined before DOM load
window.toggleGuide = function() {
    const usageInstructions = document.getElementById('usageInstructions');
    const guideChevron = document.getElementById('guideChevron');
    
    if (usageInstructions && guideChevron) {
        const isVisible = usageInstructions.style.display !== 'none';
        
        if (isVisible) {
            // Collapse
            usageInstructions.style.display = 'none';
            guideChevron.style.transform = 'rotate(0deg)';
        } else {
            // Expand
            usageInstructions.style.display = 'block';
            guideChevron.style.transform = 'rotate(180deg)';
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize accessibility error system
    if (typeof AccessibleErrorSystem !== 'undefined') {
        window.errorSystem = new AccessibleErrorSystem();
    }
    
    window.pdfImageTool = new PDFImageTool();
    
    // Expose cloud storage functions globally
    window.connectDropbox = () => window.pdfImageTool.connectDropbox();
    window.connectGoogleDrive = () => window.pdfImageTool.connectGoogleDrive();
});

// Handle any uncaught errors gracefully
window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
