export const readFileAsync = (file: File): Promise<ArrayBuffer> => {
	return file.arrayBuffer();
};
