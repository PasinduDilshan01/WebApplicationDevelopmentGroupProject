const getPosterUrl = (poster) => {

    if (!poster) {
        return "";
    }

    // Already a complete URL
    if (
        poster.startsWith("http://") ||
        poster.startsWith("https://") ||
        poster.startsWith("data:")
    ) {
        return poster;
    }

    // Remove leading slash if present
    const cleanPath = poster.replace(/^\/+/, "");

    // Load image through Vite proxy
    return `/backend-files/${cleanPath}`;
};

export default getPosterUrl;