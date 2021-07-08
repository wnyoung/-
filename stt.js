// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');

// Creates a client
const client = new speech.SpeechClient();
const fs = require('fs').promises;


const gcsUri = 'gs://2020graduationproject/1분40초.wav';
 //const gcsUri = 'gs://my-bucket/audio.raw';
 //const model = 'video';
const encoding = 'LINEAR16';
 const sampleRateHertz = 16000;
const languageCode = 'ko-KR';

async function quickstart() {
    const config = {
        encoding: encoding,
        sampleRateHertz: sampleRateHertz,
        languageCode: languageCode,
    };
    const audio = {
        uri: gcsUri,
    };

    const request = {
        config: config,
        audio: audio,
    };

    // Detects speech in the audio file. This creates a recognition job that you
    // can wait for now, or get its result later.
    const [operation] = await client.longRunningRecognize(request);
    // Get a Promise representation of the final result of the job
    const [response] = await operation.promise();
    const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
    console.log(`Transcription: ${transcription}`);
    // console.log(`results:` + JSON.stringify(response.results));
    //console.log(`Transcription: ${transcription}`);


    //createVTT(response.results);





    //const [operation] = await client.longRunningRecognize(request);
    //const [response] = await operation.promise();
    //response.results.forEach(result => {
    //    var s;
    //    alternative = result.alternatives[0];       //alternative: 한문장
    //    //console.log(`alternative: ${alternative}`);
    //    //console.log(alternative.words.length);        //문장 길이


    //    word = alternative.words[0];
    //    console.log(word);
    //    if (word.startTime.nanos == 0) {
    //        var start_time = `${word.startTime.seconds}` + '.000';
    //    } else {
    //        var start_time = `${word.startTime.seconds}` + '.' + `${word.startTime.nanos / 1000000}`;
    //    }

    //    console.log(start_time);

    //    //const start_time = word.startTime.seconds;
    //    //console.log(`start_time: ${start_time}`);
    //    //end_time = alternative.words[0].end_time;
    //    //console.log(`word: ${word}`);
    //    //console.log(alternative.words[0].startTime.seconds);
    //    //console.log(`start_time: ${start_time}`);
    //    //console.log(`end_time: ${endSecs}`);

    //    //alternative = result.alternatives[0];
    //});
}

function createVTT(results) {
	let VTT = "";
	let counter = 0;
	let phraseCounter = 0;
	let startTime = "00:00:00";
	let endTime = "00:00:00";
	let phrase = "";
	let phraseLength = 10;

    console.log('start createVTT');
	fs.writeFile('sample.vtt', "WEBVTT\n\n", 'utf8', function (error) {
        if (err) throw err;
        console.log('start WEBVTT');
	});


	//for each tracnscript
	for (var i = 0; i < results.length; i++) {
        console.log('start results[i]');

		startTime = secondsToFormat(JSON.stringify(results[i].alternatives[0].words[0].startTime.seconds.low));
		endTime = secondsToFormat(JSON.stringify(results[i].alternatives[0].words[results[i].alternatives[0].words.length-1].endTime.seconds.low));
		phrase = results[i].alternatives[0].transcript;


		fs.appendFile('sample.vtt', startTime + " --> " + endTime + '\n' + phrase + "\n\n", function (err) {
			if (err)
				throw err;
		});

	}
}

function secondsToFormat(seconds) {
    let timeHours = Math.floor(seconds / 3600).toString().padStart(2, '0');
    let timeMinutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    let timeSeconds = (seconds % 60).toString().padStart(2, '0');

    let formattedTime = timeHours + ":" + timeMinutes + ":" + timeSeconds + ".000";
    return formattedTime;
}
quickstart();