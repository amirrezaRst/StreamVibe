const fs = require('fs');

const deleteFileIfExists = async (filePath) => {
    try {
        await fs.promises.unlink(filePath);
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
    }
};

module.exports = { deleteFileIfExists };
