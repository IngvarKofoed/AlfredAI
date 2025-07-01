import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { Command, CommandArgument, CommandOption } from '../types.js';

interface CommandInputProps {
    command: Command;
    onComplete: (args: Record<string, any>) => void;
    onCancel: () => void;
}

interface InputState {
    currentStep: number;
    values: Record<string, any>;
    errors: Record<string, string>;
}

export const CommandInput: React.FC<CommandInputProps> = ({ command, onComplete, onCancel }) => {
    const [state, setState] = useState<InputState>({
        currentStep: 0,
        values: {},
        errors: {}
    });

    const allInputs = [
        ...(command.schema?.arguments || []),
        ...(command.schema?.options || [])
    ];

    const currentInput = allInputs[state.currentStep];
    const isLastStep = state.currentStep >= allInputs.length - 1;

    // Initialize default values
    useEffect(() => {
        const defaults: Record<string, any> = {};
        allInputs.forEach(input => {
            if (input.default !== undefined) {
                defaults[input.name] = input.default;
            }
        });
        // Preselect first choice for select if not set
        allInputs.forEach(input => {
            if (
                input.type === 'select' &&
                defaults[input.name] === undefined &&
                input.choices &&
                input.choices.length > 0
            ) {
                defaults[input.name] = input.choices[0].value;
            }
        });
        setState(prev => ({
            ...prev,
            values: { ...prev.values, ...defaults }
        }));
    }, []);

    const validateInput = (name: string, value: any): string | null => {
        const input = allInputs.find(i => i.name === name);
        if (!input) return null;

        // Required validation (only arguments can be required, options are always optional)
        const isRequired = 'required' in input && input.required;
        if (isRequired && (value === undefined || value === null || value === '')) {
            return `${input.name} is required`;
        }

        // Type-specific validation
        switch (input.type) {
            case 'string':
                if (input.pattern && value) {
                    const regex = new RegExp(input.pattern);
                    if (!regex.test(value)) {
                        return `${input.name} must match pattern: ${input.pattern}`;
                    }
                }
                break;
            case 'number':
                if (value !== undefined && value !== null && value !== '') {
                    const num = Number(value);
                    if (isNaN(num)) {
                        return `${input.name} must be a valid number`;
                    }
                    if (input.min !== undefined && num < input.min) {
                        return `${input.name} must be at least ${input.min}`;
                    }
                    if (input.max !== undefined && num > input.max) {
                        return `${input.name} must be at most ${input.max}`;
                    }
                }
                break;
        }

        return null;
    };

    const handleValueChange = (value: any) => {
        const error = validateInput(currentInput.name, value);
        setState(prev => ({
            ...prev,
            values: { ...prev.values, [currentInput.name]: value },
            errors: { ...prev.errors, [currentInput.name]: error || '' }
        }));
    };

    const handleNext = () => {
        const error = validateInput(currentInput.name, state.values[currentInput.name]);
        if (error) {
            setState(prev => ({
                ...prev,
                errors: { ...prev.errors, [currentInput.name]: error }
            }));
            return;
        }

        if (isLastStep) {
            onComplete(state.values);
        } else {
            setState(prev => ({
                ...prev,
                currentStep: prev.currentStep + 1
            }));
        }
    };

    const handleBack = () => {
        if (state.currentStep > 0) {
            setState(prev => ({
                ...prev,
                currentStep: prev.currentStep - 1
            }));
        } else {
            onCancel();
        }
    };

    // Add this function to bypass validation for select/boolean
    const handleNextImmediate = (selectedValue: any) => {
        setState(prev => {
            const newValues = { ...prev.values, [currentInput.name]: selectedValue };
            return {
                ...prev,
                values: newValues,
                errors: { ...prev.errors, [currentInput.name]: '' },
                currentStep: prev.currentStep + 1
            };
        });
        // If last step, call onComplete (after state update)
        if (isLastStep) {
            setTimeout(() => onComplete({ ...state.values, [currentInput.name]: selectedValue }), 0);
        }
    };

    const renderInput = () => {
        const value = state.values[currentInput.name];
        const error = state.errors[currentInput.name];

        switch (currentInput.type) {
            case 'select':
                const choices = currentInput.choices || [];
                return (
                    <Box flexDirection="column">
                        <SelectInput
                            key={value}
                            items={choices.map(choice => ({
                                label: choice.description ? `${choice.label} - ${choice.description}` : choice.label,
                                value: choice.value
                            }))}
                            onSelect={(item) => handleNextImmediate(item.value)}
                            initialIndex={choices.findIndex(c => c.value === value) || 0}
                        />
                    </Box>
                );

            case 'boolean':
                return (
                    <Box flexDirection="column">
                        <SelectInput
                            key={value}
                            items={[
                                { label: 'Yes', value: true },
                                { label: 'No', value: false }
                            ]}
                            onSelect={(item) => handleNextImmediate(item.value)}
                            initialIndex={value === true ? 0 : 1}
                        />
                    </Box>
                );

            case 'number':
                return (
                    <Box>
                        <TextInput
                            value={value?.toString() || ''}
                            onChange={(val) => handleValueChange(val)}
                            onSubmit={handleNext}
                            placeholder={`Enter a number${currentInput.min !== undefined ? ` (min: ${currentInput.min})` : ''}${currentInput.max !== undefined ? ` (max: ${currentInput.max})` : ''}`}
                        />
                    </Box>
                );

            case 'string':
            default:
                return (
                    <Box>
                        <TextInput
                            value={value || ''}
                            onChange={handleValueChange}
                            onSubmit={handleNext}
                            placeholder={`Enter ${currentInput.name}`}
                        />
                    </Box>
                );
        }
    };

    if (!currentInput) {
        return (
            <Box flexDirection="column">
                <Text color="red">No inputs defined for this command</Text>
            </Box>
        );
    }

    const progress = `${state.currentStep + 1}/${allInputs.length}`;
    const isRequired = 'required' in currentInput && currentInput.required;
    const hasError = state.errors[currentInput.name];

    return (
        <Box flexDirection="column" borderStyle="round" borderColor="blue" paddingLeft={1}>
            <Text color="blue">Command: /{command.name}</Text>
            <Text color="gray" dimColor>Step {progress}</Text>
            
            <Box marginTop={1}>
                <Text color="cyan">{currentInput.name}</Text>
                {isRequired && <Text color="red"> *</Text>}
                <Text color="gray"> - {currentInput.description}</Text>
            </Box>

            {hasError && (
                <Text color="red">❌ {hasError}</Text>
            )}

            <Box marginTop={1}>
                {renderInput()}
            </Box>

            <Box marginTop={1}>
                <Text color="gray" dimColor>
                    {isLastStep ? 'Press Enter to execute • ' : 'Press Enter to continue • '}
                    Press Escape to go back
                </Text>
            </Box>
        </Box>
    );
}; 