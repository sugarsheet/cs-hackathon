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
    const settingsFile = `${index.indexName}_settings.json`

    if (fs.existsSync(settingsFile)) {
        fs.unlinkSync(settingsFile);
    }

    return 
    // return fileName;

    // var jsonFile = fs.createWriteStream(settingsFile, {
    //     flags: 'a' // ‘a’ means appending (old data will be preserved)
    // })

    // indexSettings.settings = await index.getSettings();
    // await index .browseSynonyms({
    //     batch: synonyms => {
    //         indexSettings.synonyms = synonyms;
    //     }
    // });

    // await index.browseRules({
    //     batch: rules => {
    //         indexSettings.rules = rules
    //     }
    // });

    // jsonFile.write(JSON.stringify(indexSettings));
    // jsonFile.end()

    // return settingsFile
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
    const settingsFile = `${index.indexName}_settings.json`

    let synonyms = [];
    let rules = [];
    let indexSettings = {
        settings: '',
        rules: '',
        synonyms: ''
    }

    index.getSettings().then((settings) => {
        indexSettings.settings = settings;

        index.browseSynonyms({
            query: '', // Empty query will match all records
            batch: batch => {
                synonyms = synonyms.concat(batch);
            }
        }).then(() => {
            indexSettings.synonyms = synonyms;

            index.browseRules({
                query: '', // Empty query will match all records
                batch: batch => {
                    rules = rules.concat(batch);
                }
            }).then(() => {
                indexSettings.rules = rules;
                fs.appendFileSync(settingsFile, JSON.stringify(indexSettings));

                const files = [
                    { path: recordsFile, name: recordsFile },
                    { path: settingsFile, name: settingsFile },
                ]

                res.zip(files)
            });
        });
    });

    

    // console.log('test', settingsFile);

    // res.download(settingsFile);

    // res.zip(files);
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
