import { useState } from "react";
import { useInput } from "ink";
import clipboardy from "clipboardy";
import { SelectedFile, Command } from "../../types.js";
import path from "path";

interface UseChatInputProps {
	onSend: (message: string, files: SelectedFile[]) => void;
	commands: Command[];
}

export const useChatInput = ({ onSend, commands }: UseChatInputProps) => {
	const [input, setInput] = useState('');
	const [showFileSelector, setShowFileSelector] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

	// Filter commands based on current input
	const getSuggestions = () => {
		if (!input.startsWith('/')) return [];
		const query = input.slice(1).toLowerCase();
		return commands.filter(cmd => 
			cmd.name.toLowerCase().startsWith(query)
		);
	};

	const suggestions = getSuggestions();

	useInput(async (char, key) => {
		if (showFileSelector) {
			return;
		}

		// Handle suggestions navigation
		if (showSuggestions && suggestions.length > 0) {
			if (key.upArrow) {
				setSelectedSuggestionIndex(prev => 
					prev > 0 ? prev - 1 : suggestions.length - 1
				);
				return;
			}
			if (key.downArrow) {
				setSelectedSuggestionIndex(prev => 
					prev < suggestions.length - 1 ? prev + 1 : 0
				);
				return;
			}
			if (key.tab) {
				// Autocomplete with selected suggestion
				const selectedCmd = suggestions[selectedSuggestionIndex];
				if (selectedCmd) {
					setInput(`/${selectedCmd.name}`);
					setShowSuggestions(false);
					setSelectedSuggestionIndex(0);
				}
				return;
			}
			if (key.escape) {
				setShowSuggestions(false);
				setSelectedSuggestionIndex(0);
				return;
			}
		}

		if (key.return && input.trim()) {
			onSend(input.trim(), selectedFiles);
			setInput('');
			setSelectedFiles([]);
			setShowSuggestions(false);
			setSelectedSuggestionIndex(0);
		} else if (key.backspace || key.delete) {
			const newInput = input.slice(0, -1);
			setInput(newInput);
			
			// Update suggestions visibility
			if (newInput.startsWith('/') && newInput.length > 1) {
				setShowSuggestions(true);
				setSelectedSuggestionIndex(0);
			} else if (newInput === '/') {
				setShowSuggestions(true);
				setSelectedSuggestionIndex(0);
			} else {
				setShowSuggestions(false);
			}
		} else if (char === '@') {
			setShowFileSelector(true);
		} else if (key.ctrl && char === 'v') {
			try {
				const pastedText = await clipboardy.read();
				if (pastedText) {
					setInput(prev => prev + pastedText);
				}
			} catch (error) {
				console.error('Failed to read clipboard:', error);
			}
		} else if (char && char.length === 1) {
			const newInput = input + char;
			setInput(newInput);
			
			// Show suggestions when typing '/' or continuing after '/'
			if (char === '/' && input === '') {
				setShowSuggestions(true);
				setSelectedSuggestionIndex(0);
			} else if (newInput.startsWith('/')) {
				setShowSuggestions(true);
				setSelectedSuggestionIndex(0);
			} else {
				setShowSuggestions(false);
			}
		}
	});

	const handleFileSelect = (filePath: string, content: string) => {
		if (selectedFiles.some(file => file.path === filePath)) {
			setShowFileSelector(false);
			return;
		}

		setSelectedFiles(prev => [...prev, { path: filePath, content }]);
		setInput(prev => prev + ` @${path.basename(filePath)} `);
		setShowFileSelector(false);
	};

	const handleFileCancel = () => {
		setShowFileSelector(false);
	};

	return {
		input,
		showFileSelector,
		selectedFiles,
		showSuggestions,
		selectedSuggestionIndex,
		suggestions,
		handleFileSelect,
		handleFileCancel,
	};
}; 