const express = require('express')
const app = express()
const port = process.env.PORT || 8000
const fs = require('fs');
const algoliasearch = require('algoliasearch');
const path = require('path')
var zip = require('express-zip');

const bodyParser = require('body-parser').json();

app.use(express.urlencoded()); //Parse URL-encoded bodies

function exportRecords(index) {
    const fileName = `${index.indexName}_records.json`

    let hits = [];

    index.browseObjects({
        query: '', // Empty query will match all records
        batch: batch => {
            hits = hits.concat(batch);
        }
    }).then(() => {
        fs.writeFileSync(fileName, JSON.stringify(hits));
    });

    return fileName;
}

function exportSettings(index) {
    const fileName = `${index.indexName}_settings.json`
    let rules = [];
    let synonyms = [];

    if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName);
    }

    index.getSettings().then((settings) => {
        console.log(settings);
        fs.appendFileSync(fileName, '{');
        fs.appendFileSync(fileName, `"settings": ${JSON.stringify(settings)},`);
    });

    index.browseSynonyms({
        query: '', // Empty query will match all records
        batch: batch => {
            synonyms = synonyms.concat(batch);
        }
    }).then(() => {
        console.log(synonyms);
        fs.appendFileSync(fileName, `"synonyms": ${JSON.stringify(synonyms)},`);
    });

    index.browseRules({
        query: '', // Empty query will match all records
        batch: batch => {
            rules = rules.concat(batch);
        }
    }).then(() => {
        console.log(rules);
        fs.appendFileSync(fileName, `"rules": ${JSON.stringify(rules)}`);
        fs.appendFileSync(fileName, '}');
        fs.end();
    });

    return fileName;
}

app.post('/', bodyParser, (req, res) => {
    const appId = req.body.app_id
    const adminKey = req.body.admin_key 
    const indexName = req.body.index_name

    // need to pass APP ID and API key from the frontend
    // API key needs listIndices, browse, getSettings, searchRules...
    const client = algoliasearch(appId, adminKey);
    const index = client.initIndex(indexName);
    const recordsFile = exportRecords(index);
    const settingsFile  = exportSettings(index);
    const files = [
        { path: recordsFile, name: recordsFile },
        { path: settingsFile, name: settingsFile },
    ] 

    res.zip(files);
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
