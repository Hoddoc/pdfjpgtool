/**
 * Accessibility-focused multilingual error message system
 * Provides clear, emoji-enhanced error messages with screen reader support
 */

class AccessibleErrorSystem {
    constructor() {
        this.currentLanguage = this.detectLanguage();
        this.initializeErrorContainer();
    }

    /**
     * Detect user's preferred language
     */
    detectLanguage() {
        const saved = localStorage.getItem('preferredLanguage');
        if (saved) return saved;
        
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('ko')) return 'ko';
        if (browserLang.startsWith('ja')) return 'ja';
        if (browserLang.startsWith('zh')) return 'zh';
        return 'en';
    }

    /**
     * Set language preference
     */
    setLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('preferredLanguage', lang);
    }

    /**
     * Initialize error message container
     */
    initializeErrorContainer() {
        let container = document.getElementById('error-message-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'error-message-container';
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'true');
            container.className = 'error-message-container';
            document.body.appendChild(container);
        }
    }

    /**
     * Error message definitions with multilingual support
     */
    messages = {
        fileTooBig: {
            emoji: '📏',
            en: 'File size exceeds limit. Maximum allowed size is {maxSize}MB.',
            ko: '파일 크기가 제한을 초과했습니다. 최대 허용 크기는 {maxSize}MB입니다.',
            ja: 'ファイルサイズが制限を超えています。最大許可サイズは{maxSize}MBです。',
            zh: '文件大小超出限制。最大允许大小为{maxSize}MB。',
            severity: 'error',
            solution: {
                en: 'Try compressing your PDF or splitting it into smaller files.',
                ko: 'PDF를 압축하거나 더 작은 파일로 분할해보세요.',
                ja: 'PDFを圧縮するか、小さなファイルに分割してください。',
                zh: '尝试压缩PDF或将其分割为较小的文件。'
            }
        },
        invalidFileType: {
            emoji: '❌',
            en: 'Invalid file type. Only PDF files are supported.',
            ko: '잘못된 파일 형식입니다. PDF 파일만 지원됩니다.',
            ja: '無効なファイル形式です。PDFファイルのみサポートされています。',
            zh: '无效的文件类型。仅支持PDF文件。',
            severity: 'error',
            solution: {
                en: 'Please select a valid PDF file (.pdf extension).',
                ko: '올바른 PDF 파일(.pdf 확장자)을 선택해주세요.',
                ja: '有効なPDFファイル（.pdf拡張子）を選択してください。',
                zh: '请选择有效的PDF文件（.pdf扩展名）。'
            }
        },
        corruptedFile: {
            emoji: '🔧',
            en: 'The PDF file appears to be corrupted and cannot be processed.',
            ko: 'PDF 파일이 손상된 것 같아 처리할 수 없습니다.',
            ja: 'PDFファイルが破損しているようで、処理できません。',
            zh: 'PDF文件似乎已损坏，无法处理。',
            severity: 'error',
            solution: {
                en: 'Try using a different PDF file or repair the original file.',
                ko: '다른 PDF 파일을 사용하거나 원본 파일을 복구해보세요.',
                ja: '別のPDFファイルを使用するか、元のファイルを修復してください。',
                zh: '尝试使用不同的PDF文件或修复原始文件。'
            }
        },
        networkError: {
            emoji: '🌐',
            en: 'Network connection error. Please check your internet connection.',
            ko: '네트워크 연결 오류입니다. 인터넷 연결을 확인해주세요.',
            ja: 'ネットワーク接続エラー。インターネット接続を確認してください。',
            zh: '网络连接错误。请检查您的互联网连接。',
            severity: 'error',
            solution: {
                en: 'Check your network connection and try again.',
                ko: '네트워크 연결을 확인하고 다시 시도해주세요.',
                ja: 'ネットワーク接続を確認して再試行してください。',
                zh: '检查网络连接并重试。'
            }
        },
        cloudStorageError: {
            emoji: '☁️',
            en: 'Cloud storage connection failed. Please reconnect your account.',
            ko: '클라우드 스토리지 연결에 실패했습니다. 계정을 다시 연결해주세요.',
            ja: 'クラウドストレージの接続に失敗しました。アカウントを再接続してください。',
            zh: '云存储连接失败。请重新连接您的账户。',
            severity: 'warning',
            solution: {
                en: 'Go to Cloud Settings and reconnect your storage account.',
                ko: '클라우드 설정에서 스토리지 계정을 다시 연결하세요.',
                ja: 'クラウド設定に移動してストレージアカウントを再接続してください。',
                zh: '转到云设置并重新连接您的存储账户。'
            }
        },
        processingTimeout: {
            emoji: '⏱️',
            en: 'Processing is taking longer than expected. Large files may require more time.',
            ko: '처리 시간이 예상보다 오래 걸리고 있습니다. 큰 파일은 더 많은 시간이 필요할 수 있습니다.',
            ja: '処理が予想より長くかかっています。大きなファイルはより多くの時間が必要な場合があります。',
            zh: '处理时间比预期的长。大文件可能需要更多时间。',
            severity: 'info',
            solution: {
                en: 'Please wait a moment longer, or try with a smaller file.',
                ko: '조금 더 기다리시거나 더 작은 파일로 시도해보세요.',
                ja: 'もう少しお待ちいただくか、小さなファイルで試してください。',
                zh: '请稍等片刻，或尝试使用较小的文件。'
            }
        },
        loadingPdf: {
            emoji: '📄',
            en: 'Loading PDF file...',
            ko: 'PDF 파일을 로드하는 중...',
            ja: 'PDFファイルを読み込み中...',
            zh: '正在加载PDF文件...',
            severity: 'info',
            solution: {
                en: 'Please wait while the file is being processed.',
                ko: '파일이 처리되는 동안 잠시 기다려주세요.',
                ja: 'ファイルが処理される間、しばらくお待ちください。',
                zh: '请等待文件处理完成。'
            }
        },
        pdfLoadSuccess: {
            emoji: '✅',
            en: 'PDF loaded successfully! {pageCount} pages found.',
            ko: 'PDF 로드 완료! {pageCount}페이지를 찾았습니다.',
            ja: 'PDF読み込み完了！{pageCount}ページが見つかりました。',
            zh: 'PDF加载成功！找到{pageCount}页。',
            severity: 'success',
            solution: {
                en: 'You can now convert pages to images or extract embedded images.',
                ko: '이제 페이지를 이미지로 변환하거나 포함된 이미지를 추출할 수 있습니다.',
                ja: 'ページを画像に変換したり、埋め込まれた画像を抽出したりできるようになりました。',
                zh: '现在可以将页面转换为图像或提取嵌入的图像。'
            }
        },
        pdfLoadError: {
            emoji: '❌',
            en: 'Failed to load PDF file. The file may be corrupted or incompatible.',
            ko: 'PDF 파일 로드에 실패했습니다. 파일이 손상되었거나 호환되지 않을 수 있습니다.',
            ja: 'PDFファイルの読み込みに失敗しました。ファイルが破損しているか互換性がない可能性があります。',
            zh: '加载PDF文件失败。文件可能已损坏或不兼容。',
            severity: 'error',
            solution: {
                en: 'Try using a different PDF file or check if the file is corrupted.',
                ko: '다른 PDF 파일을 사용하거나 파일이 손상되었는지 확인해보세요.',
                ja: '別のPDFファイルを使用するか、ファイルが破損していないか確認してください。',
                zh: '尝试使用不同的PDF文件或检查文件是否损坏。'
            }
        },
        corruptedPdf: {
            emoji: '🔧',
            en: 'Invalid PDF file. The file appears to be corrupted.',
            ko: '유효하지 않은 PDF 파일입니다. 파일이 손상된 것 같습니다.',
            ja: '無効なPDFファイルです。ファイルが破損しているようです。',
            zh: '无效的PDF文件。文件似乎已损坏。',
            severity: 'error',
            solution: {
                en: 'Use a valid PDF file or try to repair the original file.',
                ko: '유효한 PDF 파일을 사용하거나 원본 파일을 복구해보세요.',
                ja: '有効なPDFファイルを使用するか、元のファイルを修復してください。',
                zh: '使用有效的PDF文件或尝试修复原始文件。'
            }
        },
        passwordProtectedPdf: {
            emoji: '🔒',
            en: 'Password-protected PDF files are not supported.',
            ko: '암호로 보호된 PDF 파일은 지원되지 않습니다.',
            ja: 'パスワードで保護されたPDFファイルはサポートされていません。',
            zh: '不支持受密码保护的PDF文件。',
            severity: 'warning',
            solution: {
                en: 'Remove the password protection from the PDF file and try again.',
                ko: 'PDF 파일의 암호 보호를 제거하고 다시 시도해주세요.',
                ja: 'PDFファイルのパスワード保護を削除して再試行してください。',
                zh: '移除PDF文件的密码保护并重试。'
            }
        },
        emptyFile: {
            emoji: '📄',
            en: 'Empty file cannot be uploaded.',
            ko: '빈 파일은 업로드할 수 없습니다.',
            ja: '空のファイルはアップロードできません。',
            zh: '无法上传空文件。',
            severity: 'warning',
            solution: {
                en: 'Please select a valid file with content.',
                ko: '내용이 있는 유효한 파일을 선택해주세요.',
                ja: '内容のある有効なファイルを選択してください。',
                zh: '请选择有内容的有效文件。'
            }
        },
        conversionFailed: {
            emoji: '⚠️',
            en: '{format} conversion failed. Please try again.',
            ko: '{format} 변환에 실패했습니다. 다시 시도해주세요.',
            ja: '{format}変換に失敗しました。再試行してください。',
            zh: '{format}转换失败。请重试。',
            severity: 'error',
            solution: {
                en: 'Check your file and try the conversion again.',
                ko: '파일을 확인하고 변환을 다시 시도해보세요.',
                ja: 'ファイルを確認して変換を再試行してください。',
                zh: '检查文件并重新尝试转换。'
            }
        },
        noImagesFound: {
            emoji: '🔍',
            en: 'No extractable images found in the PDF.',
            ko: 'PDF에서 추출할 수 있는 이미지를 찾지 못했습니다.',
            ja: 'PDFから抽出可能な画像が見つかりませんでした。',
            zh: '在PDF中未找到可提取的图像。',
            severity: 'info',
            solution: {
                en: 'This PDF may contain only text or vector graphics.',
                ko: '이 PDF는 텍스트나 벡터 그래픽만 포함하고 있을 수 있습니다.',
                ja: 'このPDFにはテキストやベクターグラフィックのみが含まれている可能性があります。',
                zh: '此PDF可能仅包含文本或矢量图形。'
            }
        },
        imageExtractionFailed: {
            emoji: '🖼️',
            en: 'Image extraction failed. Please try again.',
            ko: '이미지 추출에 실패했습니다. 다시 시도해주세요.',
            ja: '画像抽出に失敗しました。再試行してください。',
            zh: '图像提取失败。请重试。',
            severity: 'error',
            solution: {
                en: 'Try with a different PDF file or check your browser compatibility.',
                ko: '다른 PDF 파일로 시도하거나 브라우저 호환성을 확인해보세요.',
                ja: '別のPDFファイルで試すか、ブラウザの互換性を確認してください。',
                zh: '尝试使用不同的PDF文件或检查浏览器兼容性。'
            }
        },
        conversionSuccess: {
            emoji: '✅',
            en: 'File converted successfully! {count} images created.',
            ko: '파일 변환이 완료되었습니다! {count}개의 이미지가 생성되었습니다.',
            ja: 'ファイルの変換が完了しました！{count}個の画像が作成されました。',
            zh: '文件转换成功！创建了{count}个图像。',
            severity: 'success',
            solution: null
        },
        cloudStorageConnected: {
            emoji: '☁️',
            en: '{service} connected successfully!',
            ko: '{service} 연결이 완료되었습니다!',
            ja: '{service}の接続が完了しました！',
            zh: '{service}连接成功！',
            severity: 'success',
            solution: {
                en: 'You can now upload files to your cloud storage.',
                ko: '이제 클라우드 스토리지에 파일을 업로드할 수 있습니다.',
                ja: 'クラウドストレージにファイルをアップロードできるようになりました。',
                zh: '现在可以将文件上传到云存储。'
            }
        },
        oauthError: {
            emoji: '🔐',
            en: 'Authentication failed. Please try connecting to your cloud storage again.',
            ko: '인증에 실패했습니다. 클라우드 스토리지에 다시 연결해보세요.',
            ja: '認証に失敗しました。クラウドストレージに再接続してください。',
            zh: '身份验证失败。请尝试重新连接到您的云存储。',
            severity: 'warning',
            solution: {
                en: 'Click the cloud connection button and authorize access again.',
                ko: '클라우드 연결 버튼을 클릭하고 다시 액세스를 승인하세요.',
                ja: 'クラウド接続ボタンをクリックして再度アクセスを許可してください。',
                zh: '点击云连接按钮并重新授权访问。'
            }
        },
        quotaExceeded: {
            emoji: '📊',
            en: 'Storage quota exceeded. Please free up space in your cloud storage.',
            ko: '저장 공간 할당량을 초과했습니다. 클라우드 스토리지의 공간을 확보해주세요.',
            ja: 'ストレージクォータを超過しました。クラウドストレージの容量を確保してください。',
            zh: '存储配额已超出。请释放云存储中的空间。',
            severity: 'error',
            solution: {
                en: 'Delete some files from your cloud storage or upgrade your plan.',
                ko: '클라우드 스토리지에서 일부 파일을 삭제하거나 플랜을 업그레이드하세요.',
                ja: 'クラウドストレージからファイルを削除するか、プランをアップグレードしてください。',
                zh: '从云存储中删除一些文件或升级您的计划。'
            }
        },
        browserNotSupported: {
            emoji: '🌐',
            en: 'Your browser may not support all features. For best experience, use Chrome, Firefox, or Safari.',
            ko: '브라우저가 일부 기능을 지원하지 않을 수 있습니다. 최상의 경험을 위해 Chrome, Firefox 또는 Safari를 사용하세요.',
            ja: 'お使いのブラウザは一部の機能をサポートしていない可能性があります。最適な体験のためにChrome、Firefox、またはSafariをご利用ください。',
            zh: '您的浏览器可能不支持所有功能。为获得最佳体验，请使用Chrome、Firefox或Safari。',
            severity: 'warning',
            solution: {
                en: 'Consider upgrading to a modern browser for full functionality.',
                ko: '전체 기능을 위해 최신 브라우저로 업그레이드를 고려해보세요.',
                ja: '全機能を利用するために最新のブラウザへのアップグレードをご検討ください。',
                zh: '考虑升级到现代浏览器以获得完整功能。'
            }
        }
    };

    /**
     * Show error message with accessibility features
     */
    showError(messageKey, params = {}, duration = 5000) {
        const message = this.messages[messageKey];
        if (!message) {
            console.error(`Unknown error message key: ${messageKey}`);
            return;
        }

        const text = this.formatMessage(message[this.currentLanguage] || message.en, params);
        const solution = message.solution ? 
            this.formatMessage(message.solution[this.currentLanguage] || message.solution.en, params) : null;

        this.displayMessage(message.emoji, text, solution, message.severity, duration);
        
        // Announce to screen readers
        this.announceToScreenReader(text);
    }

    /**
     * Format message with parameters
     */
    formatMessage(template, params) {
        return template.replace(/\{(\w+)\}/g, (match, key) => params[key] || match);
    }

    /**
     * Display message in UI
     */
    displayMessage(emoji, text, solution, severity, duration) {
        const container = document.getElementById('error-message-container');
        
        // Clear existing messages
        container.innerHTML = '';

        const messageDiv = document.createElement('div');
        messageDiv.className = `error-message error-message--${severity}`;
        messageDiv.setAttribute('role', 'alert');
        messageDiv.setAttribute('tabindex', '0');

        const content = `
            <div class="error-message__header">
                <span class="error-message__emoji" aria-hidden="true">${emoji}</span>
                <span class="error-message__text">${text}</span>
                <button class="error-message__close" aria-label="Close message" onclick="this.parentElement.parentElement.remove()">
                    <span aria-hidden="true">×</span>
                </button>
            </div>
            ${solution ? `<div class="error-message__solution">${solution}</div>` : ''}
        `;

        messageDiv.innerHTML = content;
        container.appendChild(messageDiv);

        // Auto-remove after duration (except for errors)
        if (severity !== 'error' && duration > 0) {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, duration);
        }

        // Focus management for accessibility
        messageDiv.focus();
    }

    /**
     * Announce message to screen readers
     */
    announceToScreenReader(text) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'assertive');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = text;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    /**
     * Create language selector
     */
    createLanguageSelector() {
        const languages = {
            en: 'English',
            ko: '한국어',
            ja: '日本語',
            zh: '中文'
        };

        const selector = document.createElement('select');
        selector.id = 'language-selector';
        selector.className = 'language-selector';
        selector.setAttribute('aria-label', 'Select language');

        Object.entries(languages).forEach(([code, name]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = name;
            option.selected = code === this.currentLanguage;
            selector.appendChild(option);
        });

        selector.addEventListener('change', (e) => {
            this.setLanguage(e.target.value);
        });

        return selector;
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        const container = document.getElementById('error-message-container');
        container.innerHTML = '';
    }
}

// Initialize global error system
window.errorSystem = new AccessibleErrorSystem();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibleErrorSystem;
}