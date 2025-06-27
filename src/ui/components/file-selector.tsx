import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import fs from "fs/promises";
import path from "path";
import { FileItem } from "@/types";

interface FileSelectorProps {
	onSelect: (filePath: string, content: string) => void;
	onCancel: () => void;
}

export const FileSelector = ({ onSelect, onCancel }: FileSelectorProps) => {
	const [currentPath, setCurrentPath] = useState(process.cwd());
	const [files, setFiles] = useState<FileItem[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(0);

	useEffect(() => {
		loadFiles();
	}, [currentPath]);

	const loadFiles = async () => {
		try {
			const items = await fs.readdir(currentPath, { withFileTypes: true });
			const fileItems: FileItem[] = items
				.filter(item => !item.name.startsWith('.'))
				.map(item => ({
					name: item.name,
					isDirectory: item.isDirectory(),
					path: path.join(currentPath, item.name)
				}))
				.sort((a, b) => {
					if (a.isDirectory && !b.isDirectory) return -1;
					if (!a.isDirectory && b.isDirectory) return 1;
					return a.name.localeCompare(b.name);
				});

			setFiles(fileItems);
			setSelectedIndex(0);
		} catch (error) {
			setFiles([]);
		}
	};

	useInput((char, key) => {
		if (key.escape) {
			onCancel();
		} else if (key.return) {
			const selectedFile = files[selectedIndex];
			if (selectedFile) {
				if (selectedFile.isDirectory) {
					setCurrentPath(selectedFile.path);
				} else {
					fs.readFile(selectedFile.path, 'utf-8')
						.then(content => onSelect(selectedFile.path, content))
						.catch(() => onCancel());
				}
			}
		} else if (key.upArrow) {
			setSelectedIndex(prev => prev > 0 ? prev - 1 : files.length - 1);
		} else if (key.downArrow) {
			setSelectedIndex(prev => prev < files.length - 1 ? prev + 1 : 0);
		} else if (key.leftArrow && currentPath !== process.cwd()) {
			setCurrentPath(path.dirname(currentPath));
		}
	});

	return (
		<Box flexDirection="column" marginTop={1}>
			<Text color="green">🗁  {currentPath}</Text>
			{files.map((file, index) => (
				<Text key={file.path} color={index === selectedIndex ? "green" : "white"}>
					{index === selectedIndex ? "⤷ " : "  "}
					{file.isDirectory ? "🗁 " : "📄 "} {file.name}
				</Text>
			))}
		</Box>
	);
}; 