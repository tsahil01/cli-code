import React, { memo } from "react";
import { Box, Text } from "ink";
import { FileSelector } from "./file-selector.js";
import { CommandSuggestions } from "./command-suggestions.js";
import { AttachedFiles } from "./attached-files.js";
import { InputDisplay } from "./input-display.js";
import { SelectedFile, Command, FunctionCall, ModelData, Plan, UsageMetadata } from "../../types.js";
import { useChatInput } from "../../hooks/useChatInput.js";

interface ChatInputProps {
	onSend: (message: string, files: SelectedFile[]) => void;
	commands: Command[];
	isProcessing?: boolean;
	isDisabled?: boolean;
	currentToolCall?: FunctionCall | null;
	currentModel?: ModelData | null;
	plan: Plan;
	usage: {
		usage: UsageMetadata | null;
		totalUsage: number;
	}
	}

export const ChatInput = memo(function ChatInput({ onSend, commands, isProcessing, isDisabled, currentToolCall, currentModel, plan, usage}: ChatInputProps) {
	const {
		input,
		showFileSelector,
		selectedFiles,
		showSuggestions,
		selectedSuggestionIndex,
		suggestions,
		handleFileSelect,
		handleFileCancel,
	} = useChatInput({ onSend, commands, isDisabled: isProcessing || isDisabled });

	return (
		<Box flexDirection="column">
			{showFileSelector && (
				<FileSelector onSelect={handleFileSelect} onCancel={handleFileCancel} />
			)}

			<CommandSuggestions
				suggestions={suggestions}
				selectedIndex={selectedSuggestionIndex}
				visible={showSuggestions}
			/>

			<Box flexGrow={1} flexDirection="column">
				<InputDisplay
					input={input}
					isProcessing={isProcessing}
					currentToolCall={currentToolCall}
					currentModel={currentModel}
					plan={plan}
					usage={usage}
				/>
			</Box>
			{/* </Box> */}

			<AttachedFiles files={selectedFiles} />
		</Box>
	);
});