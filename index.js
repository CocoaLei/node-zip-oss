const getRawBody = require('raw-body');
const downloadZipHandler = require('./handler');

async function serializedRequest(req) {
    try {
        let { url, path, queries } = req;
        const body = await getRawBody(req);
        const data = JSON.parse(body);
        return {
            method: req.method,
            headers: req.headers,
            url,
            path,
            queries,
            data
        };
    } catch (e) {
        console.error('serializedRequest error = ', e);
        throw new Error(e.message || '请求解析发生错误');
    }
}

function constructResponse(resp, hasError, message) {
    return {
        success: !hasError,
        message,
        data: resp,
    }
}


exports.handler = async function(req, resp) {
    try {
        const request = await serializedRequest(req);
        if (request.path === '/oss-zip') {
            const res = await downloadZipHandler(request);
            const responseObj = constructResponse(res, false, '成功');
            resp.send(JSON.stringify(responseObj));
        } else {
            resp.send(JSON.stringify(constructResponse('', true, '路径不可用')));
        }
    } catch (e) {
        console.error('e = ', e);
        resp.send(JSON.stringify(constructResponse('', true, e.message)));
    }
}
