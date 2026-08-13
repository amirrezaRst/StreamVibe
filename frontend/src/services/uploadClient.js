const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export class UploadAbortError extends Error {
    constructor() {
        super("Upload cancelled");
        this.name = "UploadAbortError";
    }
}

/**
 * multipart uploads with real progress — apiFetch (and the Fetch API under
 * it) has no upload-progress event at all, only XMLHttpRequest exposes
 * `upload.onprogress`, so this is a separate small client rather than an
 * apiFetch option.
 *
 * Returns `{ promise, cancel }` rather than just a promise, since the caller
 * needs a handle to abort an in-flight transfer (a "Cancel" button on a
 * multi-GB file) — something a bare promise can't expose.
 *
 * IMPORTANT: multer's filename() callback (backend/utils/videoUploader.js)
 * reads req.body.title / req.body.episodeNumber to name the file on disk, and
 * multipart fields are only available in the order they were appended to the
 * FormData. Callers must append every text field BEFORE any file field, or
 * the uploaded file gets named from an empty body.
 */
export const uploadRequest = (path, formData, { method = "POST", onProgress } = {}) => {
    const xhr = new XMLHttpRequest();

    const promise = new Promise((resolve, reject) => {
        xhr.open(method, `${BASE_URL}${path}`);
        xhr.withCredentials = true;

        xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable || !onProgress) return;
            onProgress({ loaded: event.loaded, total: event.total });
        };

        xhr.onload = () => {
            let data;
            try { data = JSON.parse(xhr.responseText); } catch { data = null; }

            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(data);
            } else {
                const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
                reject(new Error(message || `Upload failed (${xhr.status})`));
            }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.onabort = () => reject(new UploadAbortError());

        xhr.send(formData);
    });

    return { promise, cancel: () => xhr.abort() };
};
