import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import clipboardy from "clipboardy";
import { FileSelector } from "./file-selector.js";
import { SelectedFile } from "@/types";

export const ChatInput = ({onSend}: {onSend: (message: string, files: SelectedFile[]) => void}) => {
	const [input, setInput] = useState('');
	const [showFileSelector, setShowFileSelector] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

	useInput(async (char, key) => {
		if (showFileSelector) {
			return;
		}

		if (key.return && input.trim()) {
			onSend(input.trim(), selectedFiles);
			setInput('');
			setSelectedFiles([]);
		} else if (key.backspace || key.delete) {
			setInput(prev => prev.slice(0, -1));
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
			setInput(prev => prev + char);
		}
	});

	const handleFileSelect = (filePath: string, content: string) => {
		if (selectedFiles.some(file => file.path === filePath)) {
			setShowFileSelector(false);
			return;
		}

		setSelectedFiles(prev => [...prev, { path: filePath, content }]);
		setInput(prev => prev + ` @${filePath} `);
		setShowFileSelector(false);
	};

	const handleFileCancel = () => {
		setShowFileSelector(false);
	};


	return (
		<Box flexDirection="column">
			{showFileSelector && (
				<FileSelector onSelect={handleFileSelect} onCancel={handleFileCancel} />
			)}

			<Box 
				borderStyle="round" 
				borderColor="gray"
				marginTop={1}
			>
				<Text color="blue" bold>❯ </Text>
				<Text color="white">
					{input ? (() => {
						const parts = input.split(/(@[^\s]+)/g);
						return parts.map((part, index) => {
							if (part.startsWith('@')) {
								return <Text key={index} color="green">{part}</Text>;
							}
							return <Text key={index} color="white">{part}</Text>;
						});
					})() : 'Ask me anything...'}
				</Text>
				<Text color="gray">|</Text>
			</Box>
			
			{selectedFiles.length > 0 && (
				<Box flexDirection="column">
					<Text color="gray">{selectedFiles.length} file(s) attached</Text>
                    {selectedFiles.map((file, index) => (
                        <Box key={index} paddingLeft={2}>
                            <Text color="gray">• {file.path}</Text>
                        </Box>
                    ))}
				</Box>
			)}
		</Box>
	);
};