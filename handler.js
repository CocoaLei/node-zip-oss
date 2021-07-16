const ots = require('tablestore');
let OSS = require('ali-oss');
const archiver = require('archiver');
const zlib = require('zlib');

module.exports = async function (req) {
    try {
        return await uploadZipToOss();
    } catch (e) {
        throw Error(e.message);
    }
}

async function uploadZipToOss() {
    try {
        const { OSS_REGION, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_END_POINT, OSS_BUCKET_NAME, OSS_EXPORT_ZIP_BUCKET_NAME } = process.env;
        // 配置上传 oss client
        const uploadOssClient = new OSS({
            region: OSS_REGION,
            endpoint: OSS_END_POINT,
            accessKeyId: OSS_ACCESS_KEY_ID,
            accessKeySecret: OSS_ACCESS_KEY_SECRET,
            bucket: OSS_EXPORT_ZIP_BUCKET_NAME,
            timeout: 600000
        });
        // 构造 zip 文件名称
        const zipFileName = 'example.zip';
        // 检测 zipFile 文件是否存在，如果存在，则直接返回下载链接
        try {
            const zipFileHeadResult = await uploadOssClient.head(zipFileName);
            if (zipFileHeadResult.status === 200) {
                const zipFilUrls = zipFileHeadResult.res.requestUrls;
                if (zipFilUrls.length > 0) {
                    console.log('zip file already exists and return file download url');
                    return [`${OSS_END_POINT}/${zipFileName}`];
                }
            }
        } catch (e) {
            console.log('zip not exist = ', e);
        }

        // 构造压缩文件
        const zipFile = archiver('zip', {
            zlib: { level: 9 }
        });
        // 构造下载 oss client
        const downloadOssClient = new OSS({
            region: OSS_REGION,
            accessKeyId: OSS_ACCESS_KEY_ID,
            accessKeySecret: OSS_ACCESS_KEY_SECRET,
            bucket: OSS_BUCKET_NAME,
            timeout: 600000,
        });
        // 需要下载的文件列表
        const files = [];
        for (let index = 0, length = files.length; index < length; index += 1) {
            const file = files[index];
            const filePath = file.path;
            try {
                // 查询下载的资源是否存在
                await downloadOssClient.head(filePath);
                const fileDownRes = await downloadOssClient.getStream(filePath);
                zipFile.append(fileDownRes.stream, { name: message['filename'] || message.text_md5 });
            } catch (e) {
                console.error('down load error');
            }
        }
        zipFile.finalize();
        try {
            const uploadZipRes = await uploadOssClient.putStream(zipFileName, zipFile);
            if (uploadZipRes.res.status === 200) {
                return [`${OSS_END_POINT}/${zipFileName}`];
            }
        } catch (e) {
            console.error('upload zip error = ', e);
        }
    } catch (e) {
        console.log('upload zip file went wrong = ', e);
    }
}
