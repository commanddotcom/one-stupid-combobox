// Скрипт для пошуку та логування масивів опцій з data-params на Google Forms
(function() {
    'use strict';
    
    const DEBUG_ENABLED = false;
    var formSelectItems = [];
    var searchText = '';
    var searchFocus = false;

    function debug(data) {
        if (DEBUG_ENABLED) {
            console.log(data)
        }
    }

    class OneStupidCombobox {
        constructor() {
            this.init();
        }

    init() {
        debug('init()');
        
        // Чекаємо завантаження сторінки
        if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            this.findAndLogOptions();
            this.addGlobalListboxListeners();
            this.addAdvancedSearchInput();
        });
        } else {
            this.findAndLogOptions();
            this.addGlobalListboxListeners();
            this.addAdvancedSearchInput();
        }

        // Add keydown listener to body
        document.body.addEventListener('keydown', (event) => {
            this.interseptKey(event);
        });

        // Спостерігаємо за змінами в DOM
        this.observeChanges();
    }

    findAndLogOptions() {
        debug('Шукаємо елементи з data-params...');
        
        const elementsWithDataParams = document.querySelectorAll('[data-params]');

        debug(`Знайдено ${elementsWithDataParams.length} елементів з data-params`);

        elementsWithDataParams.forEach((element, index) => {
        try {
            const dataParams = element.getAttribute('data-params');
            debug(`\nЕлемент #${index + 1}:`);
            debug('Raw data-params:', dataParams);
            
            // Витягуємо масиви опцій
            const optionsArrays = this.extractOptionsFromDataParams(dataParams);
            
            if (optionsArrays.length > 0) {
            debug(`Знайдено ${optionsArrays.length} масивів опцій:`);
            let listboxDOM = element.querySelector('[role="listbox"]');
            
            // Add click event listener to listbox
            if (listboxDOM) {
                this.addListboxClickListener(listboxDOM);
            }
            
            // optionsArrays.forEach((optionsArray, arrayIndex) => {
            //     debug(`Масив опцій #${arrayIndex + 1}:`, optionsArray);
            //     if (listboxDOM && optionsArray) {
            //         formSelectItems.push([listboxDOM, optionsArray]);
            //         debug('optionsArray', optionsArray);
            //         debug('optionsDOM:', optionsDOM);
            //         debug('listbox: ', listboxDOM);
            //     }
            // });

            } else {
                debug('Масиви опцій не знайдено');
            }
        } catch (error) {
                debug(`Помилка при обробці елемента #${index + 1}:`, error);
        }
        });
        debug(formSelectItems);
    }

    extractOptionsFromDataParams(dataParams) {
        const optionsArrays = [];
        
        try {
        // Декодуємо HTML entities
        let decodedParams = dataParams
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\\u003c/g, '<')
            .replace(/\\u003e/g, '>')
            .replace(/\\\"/g, '"');

        //console.log('Декодовані параметри (перші 500 символів):', decodedParams.substring(0, 500) + '...');

        // Простий і надійний підхід: шукаємо всі масиви що починаються з [[
        const arrayMatches = this.findAllArrayStructures(decodedParams);
        
        debug(`Знайдено ${arrayMatches.length} потенційних структур масивів`);
        
        arrayMatches.forEach((arrayStr, index) => {
            debug(`\nСтруктура #${index + 1} (перші 200 символів):`, arrayStr.substring(0, 200) + '...');
            
            // Витягуємо всі рядки в лапках з цієї структури
            const extractedOptions = this.extractAllQuotedStrings(arrayStr);
            
            if (extractedOptions.length >= 3) { // Мінімум 3 опції
            debug(`Знайдено ${extractedOptions.length} опцій:`, extractedOptions);
            optionsArrays.push(extractedOptions);
            } else {
            debug(`Недостатньо опцій (${extractedOptions.length}), пропускаємо`);
            }
        });

        } catch (error) {
        debug('Помилка при витягуванні опцій:', error);
        }

        return optionsArrays;
    }

    findAllArrayStructures(text) {
        const structures = [];
        const arrayRegex = /\[\[[^\]]*\]\]/g;
        let match;
        
        // Спочатку пробуємо простий regex
        while ((match = arrayRegex.exec(text)) !== null) {
        structures.push(match[0]);
        }
        
        // Якщо не знайшли нічого, шукаємо більш складні структури
        if (structures.length === 0) {
        let pos = 0;
        while (pos < text.length) {
            const startIndex = text.indexOf('[[', pos);
            if (startIndex === -1) break;
            
            // Шукаємо відповідний закриваючий ]]
            let depth = 0;
            let endIndex = startIndex;
            
            for (let i = startIndex; i < text.length; i++) {
            if (text.substring(i, i + 2) === '[[') {
                depth++;
                i++; // пропускаємо другий [
            } else if (text.substring(i, i + 2) === ']]') {
                depth--;
                if (depth === 0) {
                endIndex = i + 2;
                break;
                }
                i++; // пропускаємо другий ]
            }
            }
            
            if (endIndex > startIndex) {
            const structure = text.substring(startIndex, endIndex);
            structures.push(structure);
            pos = endIndex;
            } else {
            pos = startIndex + 2;
            }
        }
        }
        
        return structures;
    }

    extractAllQuotedStrings(text) {
        const options = [];
        const quotedStringRegex = /"([^"]+)"/g;
        let match;
        
        while ((match = quotedStringRegex.exec(text)) !== null) {
        const option = match[1];
        
        // Фільтруємо системні рядки та HTML
        if (option.length > 0 && 
            !option.match(/^[ibu]\d+$/) && // системні ID
            !option.includes('\\u') && // unicode escape
            !option.includes('<b>') && // HTML теги
            !option.includes('<i>') &&
            !option.includes('<br>') &&
            option !== 'Choose') { // стандартне заповнення
            options.push(option);
        }
        }
        
        // Видаляємо дублікати
        return [...new Set(options)];
    }

    flattenOptionsArray(arrayOfArrays) {
        const options = [];
        
        for (const item of arrayOfArrays) {
        if (Array.isArray(item)) {
            if (item.length > 0 && typeof item[0] === 'string') {
            options.push(item[0]); // Беремо перший елемент з вкладеного масиву
            }
        } else if (typeof item === 'string') {
            options.push(item);
        }
        }
        
        return options;
    }

    observeChanges() {
        const observer = new MutationObserver((mutations) => {
        let shouldCheck = false;
        
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.hasAttribute && node.hasAttribute('data-params') || 
                    node.querySelector && node.querySelector('[data-params]')) {
                    shouldCheck = true;
                }
                }
            });
            }
        });

        if (shouldCheck) {
            debug('Виявлено зміни в DOM, повторюємо пошук...');
            setTimeout(() => this.findAndLogOptions(), 500);
        }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    interseptKey(event) {
        let value = event.key;
        if (searchFocus) {
            if (value === 'Backspace') {
                // Erase one character from the end
                if (searchText.length > 0) {
                    searchText = searchText.slice(0, -1);
                    this.updateGform();
                }
            } else if (value.length === 1 && /[0-9\s~!@#$%^&*()_+\-=\[\]{}:;,./\\]/.test(value)) {
                searchText += value;
                this.updateGform();
            }
            
            // Filter options based on searchText
            this.filterOptionsBySearchText();
        }
        debug('searchText', searchText);
    }

    //  method to filter options based on searchText
    filterOptionsBySearchText() {
        const optionsDOM = document.querySelectorAll('div[data-params] div[role="listbox"][aria-expanded="true"] > div > div');
        debug('optionsDOM =>', optionsDOM);
        
        if (optionsDOM) {
            optionsDOM.forEach((option) => {
                const dataValue = option.getAttribute('data-value') || '';
                if (!dataValue) {
                    return;
                }
                debug('dataValue', dataValue);
                // Check if searchText is contained in data-value attribute
                if (dataValue.toLowerCase().includes(searchText.toLowerCase())) {
                    // Remove hide-important class to show the option
                    option.classList.remove('hide-important');
                    debug('dataValue show');
                } else {
                    // Add hide-important class to hide the option
                    option.classList.add('hide-important');
                    debug('dataValue hide');
                }
            });
            
            debug(`Filtered ${optionsDOM.length} options for searchText: "${searchText}"`);
        }
    }

    showGform() {
        debug('showGform()');
        document.getElementById('gforms-search-container').className = '';
    }
    hideGform() {
        debug('hideGform()');
        document.getElementById('gforms-search-container').className = 'hide-important';
    }
    updateGform() {
        document.getElementById('gforms-search-input').innerHTML = searchText;
        // Apply filtering when updating the form
        this.filterOptionsBySearchText();
    }

    // add click listener to listbox
    addListboxClickListener(listboxElement) {
        // Check if listener already added to avoid duplicates
        if (listboxElement.dataset.gformsListenerAdded) {
            return;
        }

        // Add attribute change observer for aria-expanded
        const attributeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'aria-expanded') {
                    const ariaExpanded = listboxElement.getAttribute('aria-expanded');
                    if (ariaExpanded === 'true') {
                        this.showGform();
                    } else if (ariaExpanded === 'false') {
                        this.hideGform();
                        searchFocus = false;
                    }
                    searchText = '';
                    searchFocus = true;
                    this.updateGform();
                }
            });
        });

        // Start observing attribute changes
        attributeObserver.observe(listboxElement, {
            attributes: true,
            attributeFilter: ['aria-expanded']
        });

        // Mark as having listener added
        listboxElement.dataset.gformsListenerAdded = 'true';
        
        debug('Click listener and attribute observer added to listbox');
    }

    // Enhanced method to add global listbox listeners
    addGlobalListboxListeners() {
        // Add listeners to all existing listboxes
        const allListboxes = document.querySelectorAll('[role="listbox"]');
        allListboxes.forEach(listbox => {
            this.addListboxClickListener(listbox);
        });

        // Observer for dynamically added listboxes
        const listboxObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                // Check if added node is a listbox
                if (node.getAttribute && node.getAttribute('role') === 'listbox') {
                this.addListboxClickListener(node);
                }
                
                // Check for listboxes within added node
                const nestedListboxes = node.querySelectorAll && node.querySelectorAll('[role="listbox"]');
                if (nestedListboxes) {
                nestedListboxes.forEach(listbox => {
                    this.addListboxClickListener(listbox);
                });
                }
            }
            });
        });
        });

        listboxObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    addAdvancedSearchInput() {
        if (document.getElementById('gforms-search-input')) return;

        const container = document.createElement('div');
        container.innerHTML = `
            <div class="hide-important" id="gforms-search-container" style="
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: #92d2ff;
                border: 1px solid #619eed;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                padding: 12px 12px 5px;
                min-width: 250px;
                font-size: 1rem;
                line-height: 1rem;
                font-weight: bold;
            ">Для швидкого пошуку використовуйте цифри на клавіатурі: <span id="gforms-search-input"></span>
            <div id="search-results" style="
                margin-top: 8px;
                max-height: 200px;
                overflow-y: auto;
                font-size: 12px;
                color: #666;
            "></div>
            </div>
        `;

        document.body.appendChild(container);
    }

}

// Ініціалізуємо скрипт тільки на сторінках Google Forms
try {
    if (window.location.href.includes('docs.google.com/forms/')) {
      new OneStupidCombobox();
    } else {
      debug('Не сторінка Google Forms, скрипт не активовано');
    }
  } catch (error) {
    debug('Помилка ініціалізації OneStupidCombobox:', error);
  }
})();


