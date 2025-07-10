import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { get_active_file, get_text_selection } from "../../lib/tools.js";
import { ActiveFileInfo, TextSelectionInfo, FunctionCall, AnthropicFunctionCall, GeminiFunctionCall, OpenAIFunctionCall } from "../../types.js";

interface InputDisplayProps {
	input: string;
	isProcessing?: boolean;
	currentToolCall?: FunctionCall | null;
}

const LoadingIndicator = () => {
	const [frame, setFrame] = React.useState(0);
	const frames = ['◜', '◠', '◝', '◞', '◡', '◟'];

	React.useEffect(() => {
		const timer = setInterval(() => {
			setFrame(f => (f + 1) % frames.length);
		}, 100);
		return () => clearInterval(timer);
	}, []);

	return <Text color="cyan">{frames[frame]}</Text>;
};

export const InputDisplay = ({ input, isProcessing, currentToolCall }: InputDisplayProps) => {
	const [activeFile, setActiveFile] = useState<ActiveFileInfo | null>(null);
	const [textSelection, setTextSelection] = useState<TextSelectionInfo | null>(null);

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

	const getToolName = (toolCall: FunctionCall) => {
		return (toolCall as AnthropicFunctionCall).name || (toolCall as GeminiFunctionCall).name || (toolCall as OpenAIFunctionCall).function.name || null;
	};

	return (
		<Box flexDirection="column">
			<Box 
				borderStyle="round" 
				borderColor="gray"
				paddingX={1}
				paddingY={0}
			>
				{isProcessing ? (
					<Box>
						<LoadingIndicator />
						<Text color="cyan"> {currentToolCall ? `Running ${getToolName(currentToolCall)}...` : 'Processing...'}</Text>
					</Box>
				) : (
					<Box>
						<Text color="cyan" bold>❯ </Text>
						<Text color="white">
							{input ? (() => {
								const parts = input.split(/(@[^\s]+)/g);
								return parts.map((part, index) => {
									if (part.startsWith('@')) {
										return <Text key={index} color="green">{part}</Text>;
									}
									return <Text key={index} color="white">{part}</Text>;
								});
							})() : <Text color="gray">Ask me anything...</Text>}
						</Text>
					</Box>
				)}
			</Box>
			{activeFile && (
				<Box justifyContent="flex-end" marginTop={0}>
					<Text color="gray">
						{activeFile.name}
						{textSelection && (
							<Text>
								<Text> • </Text>
								<Text color="cyan">lines {textSelection.startLine + 1}-{textSelection.endLine + 1}</Text>
							</Text>
						)}
					</Text>
				</Box>
			)}
		</Box>
	);
}; 