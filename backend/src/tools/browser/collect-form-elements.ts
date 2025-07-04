export interface FormElementData {
    tagName: string;
    type?: string;
    id?: string;
    name?: string;
    value?: string;
    placeholder?: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    label?: string;
    innerText?: string;
    onclick?: string;
    inForm?: boolean;
    formId?: string;
}

export function collectFormElements(document: Document): FormElementData[] {
    const formElements: FormElementData[] = [];
    const processedKeys = new Set<string>();
    
    // Get all interactive form elements (excluding form tags themselves to avoid duplicates)
    const elements = document.querySelectorAll('input, button, select, textarea');
    
    elements.forEach((element) => {
        // Skip hidden elements
        if (element.tagName.toLowerCase() === 'input' && element.getAttribute('type') === 'hidden') {
            return;
        }
        
        // Create a unique key for this element based on its characteristics
        const elementKey = createElementKey(element);
        
        // Skip if we've already processed an element with this key
        if (processedKeys.has(elementKey)) {
            return;
        }
        
        processedKeys.add(elementKey);
        const elementData: FormElementData = {
            tagName: element.tagName.toLowerCase()
        };
        
        // Collect basic attributes
        if (element.hasAttribute('type')) {
            elementData.type = element.getAttribute('type') || undefined;
        }
        if (element.hasAttribute('id')) {
            elementData.id = element.getAttribute('id') || undefined;
        }
        if (element.hasAttribute('name')) {
            elementData.name = element.getAttribute('name') || undefined;
        }
        if (element.hasAttribute('value')) {
            elementData.value = element.getAttribute('value') || undefined;
        }
        if (element.hasAttribute('placeholder')) {
            elementData.placeholder = element.getAttribute('placeholder') || undefined;
        }
        if (element.hasAttribute('aria-label')) {
            elementData['aria-label'] = element.getAttribute('aria-label') || undefined;
        }
        if (element.hasAttribute('aria-labelledby')) {
            elementData['aria-labelledby'] = element.getAttribute('aria-labelledby') || undefined;
        }
        
        // Handle button-specific properties
        if (element.tagName.toLowerCase() === 'button') {
            elementData.innerText = element.textContent?.trim() || undefined;
            if (element.hasAttribute('onclick')) {
                elementData.onclick = element.getAttribute('onclick') || undefined;
            }
        }
        
        // Check if element is in a form
        const parentForm = element.closest('form');
        if (parentForm) {
            elementData.inForm = true;
            elementData.formId = parentForm.getAttribute('id') || undefined;
        } else {
            elementData.inForm = false;
        }
        
        // Try to find associated label
        elementData.label = findAssociatedLabel(element, document);
        
        formElements.push(elementData);
    });
    
    return formElements;
}

function createElementKey(element: Element): string {
    const tagName = element.tagName.toLowerCase();
    const type = element.getAttribute('type') || '';
    const id = element.getAttribute('id') || '';
    const name = element.getAttribute('name') || '';
    const value = element.getAttribute('value') || '';
    
    // Create a unique key based on the element's identifying characteristics
    return `${tagName}:${type}:${id}:${name}:${value}`;
}

function findAssociatedLabel(element: Element, document: Document): string | undefined {
    // Method 1: Check for label with matching 'for' attribute
    if (element.hasAttribute('id')) {
        const id = element.getAttribute('id');
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) {
            return label.textContent?.trim() || undefined;
        }
    }
    
    // Method 2: Check for aria-labelledby
    if (element.hasAttribute('aria-labelledby')) {
        const labelledby = element.getAttribute('aria-labelledby');
        const labelElement = document.getElementById(labelledby!);
        if (labelElement) {
            return labelElement.textContent?.trim() || undefined;
        }
    }
    
    // Method 3: Check for aria-label
    if (element.hasAttribute('aria-label')) {
        return element.getAttribute('aria-label') || undefined;
    }
    
    // Method 4: Check DOM proximity - look for label in parent or previous sibling
    let current = element.parentElement;
    while (current) {
        // Check if current element is a label
        if (current.tagName.toLowerCase() === 'label') {
            return current.textContent?.trim() || undefined;
        }
        
        // Check previous sibling for label
        let sibling = element.previousElementSibling;
        while (sibling) {
            if (sibling.tagName.toLowerCase() === 'label') {
                return sibling.textContent?.trim() || undefined;
            }
            sibling = sibling.previousElementSibling;
        }
        
        current = current.parentElement;
    }
    
    return undefined;
}