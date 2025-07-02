import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { get_active_file, get_text_selection } from "../../lib/tools.js";
import { ActiveFileInfo, TextSelectionInfo, FunctionCall, AnthropicFunctionCall } from "../../types.js";

interface InputDisplayProps {
	input: string;
	isProcessing?: boolean;
	currentToolCall?: FunctionCall | null;
}

export const InputDisplay = ({ input, isProcessing, currentToolCall }: InputDisplayProps) => {
	const [activeFile, setActiveFile] = useState<ActiveFileInfo | null>(null);
	const [textSelection, setTextSelection] = useState<TextSelectionInfo | null>(null);
	const [frame, setFrame] = React.useState(0);
	const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

	useEffect(() => {
		const updateFileInfo = async () => {
			try {
				const file = await get_active_file() as ActiveFileInfo | null;
				const selection = await get_text_selection() as TextSelectionInfo | null;
				setActiveFile(file);
				setTextSelection(selection);
			} catch (error) {
				console.error("Failed to get file info:", error);
			}
		};

		updateFileInfo();
		const interval = setInterval(updateFileInfo, 500);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (isProcessing) {
			const timer = setInterval(() => {
				setFrame(f => (f + 1) % frames.length);
			}, 80);
			return () => clearInterval(timer);
		}
	}, [isProcessing]);

	return (
		<Box flexDirection="column">
			<Box 
				borderStyle="round" 
				borderColor="gray"
			>
				<Text color="blue" bold>❯ </Text>
				{isProcessing ? (
					<>
						<Text color="yellow">{frames[frame]} </Text>
						{currentToolCall ? (
							<Text color="yellow">Running tool: {
								'functionCall' in currentToolCall 
									? currentToolCall.functionCall.name 
									: (currentToolCall as AnthropicFunctionCall).name
							}...</Text>
						) : (
							<Text color="yellow">Processing...</Text>
						)}
					</>
				) : (
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
				)}
				<Text color="gray">|</Text>
			</Box>
			{activeFile && (
				<Box justifyContent="flex-end">
					<Text dimColor>
						{activeFile.name}
						{textSelection && (
							<Text>
								<Text> • </Text>
								<Text color="yellow">lines {textSelection.startLine + 1}-{textSelection.endLine + 1}</Text>
							</Text>
						)}
					</Text>
				</Box>
			)}
		</Box>
	);
}; 