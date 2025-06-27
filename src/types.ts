export type ToolInput = {
    cmd?: string,
    filePath?: string,
    content?: string,
    processId?: string,
    searchTerm?: string,
    url?: string
}

export interface FileItem {
	name: string;
	isDirectory: boolean;
	path: string;
}

export interface SelectedFile {
	path: string;
	content: string;
}

export interface Command {
    name: string;
    description: string;
    args: string[];
    options: string[];
}