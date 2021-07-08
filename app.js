//render setting!
//@'/speakername' -> res.render('speakername',{videofilename:videofilename, speakerlist:speakerlist});
//not use STT -> app.post('/speakername', upload.single('userfile'), function (req, res) {
// use STT -> async function dostt(res) { -> createVTT(response, function (err) {

//@'/speaker' -> res.render('speaker',{videofilename:videofilename});
//not use STT -> app.post('/speaker', function (req, res) {
// use STT -> app.post('/speaker', function (req, res) { -> createSpeakerVTT(function (err) {


//필요한 모듈 불러오기
const express = require('express')
const app = express()
const port = 5000
const fs = require('fs').promises;
const _fs = require('fs');
const bodyParser = require('body-parser');	//사용자 입력 받기(post)
const multer = require('multer');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

var videofilename = '';
var videoPath = '';
var audioPath = '';
var subtitlePath = '';
var speakerSubtitlePath = '';
var result = {};
var speakerlist=[];
var speakerset=new Set([]);
var speakermap = new Map();

//웹에서 서버로 업로드
var _storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads/')		//업로드 디렉터리
		console.log('비디오 업로드 완료');
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	}
})

var upload = multer({ storage: _storage });
var filename ='';
//const speech = require('@google-cloud/speech');
const speech = require('@google-cloud/speech').v1p1beta1;

// Creates a client
const client = new speech.SpeechClient();


const { Storage } = require('@google-cloud/storage');
const { count } = require('console');
const files = {};
const storage = new Storage({
	keyFilename: path.join(__dirname, "../../school/2020/2020-3/졸업프로젝트/stt설치/stt-295102-297283ad64a6.json"),
	projectId: "stt-295102"
});


app.locals.pretty = true;
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.set('views', './views');

//app.use(express.static('public'));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/uploads'));
app.use(express.static(__dirname + '/subtitles/vtt'));

//메인화면 업로드 받기
//req: 클라이언트가 서버에 요청
//res: 서버가 클라이언트에 응답
app.get('/', function (req, res) {
	//res.render('main');	//jade version
	res.sendFile(__dirname+'/public/index.html');
	//res.render('index');
});

app.get('/uploadForm', function (req, res) {
	//res.render('main');	//jade version
	res.sendFile(__dirname+'/public/uploadForm.html');
	//res.render('index');
});

//업로드 후 다운받는 화면
app.post('/speakername', upload.single('userfile'), function (req, res) {

	filename = path.parse(req.file.originalname).name;
	videofilename = path.parse(req.file.originalname).name;
	console.log('file name: ' + filename);
	videoPath = `${__dirname}/uploads/${filename}.mp4`;
	audioPath = `${__dirname}/uploads/${filename}.wav`;
	subtitlePath = `${__dirname}/subtitles/vtt/${filename}.vtt`;
	speakerSubtitlePath = `${__dirname}/subtitles/vtt/${filename}speaker.vtt`;
	console.log('video Path: ' + videoPath);
	console.log('audio Path: ' + audioPath);
	console.log('subtitle Path: ' + subtitlePath);

	res.render('speakername',{videofilename:videofilename, speakerlist:speakerlist});  //실제 stt사용하는 경우에서는 없애기! //not use STT
	//res.sendFile(__dirname+'/public/speakername.html');

	convert(videoPath, audioPath, function (err) {
		if (!err) {
			console.log('오디오 추출 완료');
			uploadGCP(function (err) {
				if (!err) {
					console.log('오디오 파일 gcp업로드 완료');
					dostt(res);	//stt처리
        }
			});

		}
	});



});

app.get('/videodownload', function (req, res) {
//1
//2

	res.download(videoPath); // Set disposition and send it.
});
app.get('/subdownload', function (req, res) {
	res.download(subtitlePath); // Set disposition and send it.
});
app.get('/subspeakerdownload', function (req, res) {
	res.download(speakerSubtitlePath); // Set disposition and send it.
});

//speaker 지정 후 다운 받는 화면
app.post('/speaker', function (req, res) {
	res.render('speaker',{videofilename:videofilename}); //실제로는 없애주기 //not use STT

	console.log('speaker!!!!!!!!!!!!!');
	console.log('obj');
	const obj = JSON.parse(JSON.stringify(req.body));
	console.log(obj);

	for(const key in obj) {
	    speakermap.set(key, obj[key]);
	}
	console.log('speakermap');
	console.log(speakermap);



	// console.log(speakermap);


	createSpeakerVTT(function (err) {
		if (!err) {
			console.log('Speaker자막생성 완료');
			//res.render('speaker',{videofilename:videofilename}); //use STT
		}
	});


});



async function dostt(res) {
	// Reads a local audio file and converts it to base64
	var gcsUri = `gs://2020graduationproject/${videofilename}.wav`;

	const audio = {
		//content: audioBytes,
		uri: gcsUri,
	};
	const config = {
		enableWordTimeOffsets: true,	//타임스탬//
		encoding: 'LINEAR16',
		sampleRateHertz: 16000,		//가능하면 오디오 소스의 샘플링 레이트를 16,000Hz로 설정합니다.
		languageCode: 'en-US',
		maxAlternatives:2,
		enableSpeakerDiarization: true,
		model: 'video'
	};
	const request = {
		audio: audio,
		config: config,
	};


	const [operation] = await client.longRunningRecognize(request);		//비동기식 요청
	const [response] = await operation.promise();

	createVTT(response, function (err) {
		if (!err) {
			console.log('자막생성 완료');
			speakerset = new Set(speakerlist);
			speakerlist = Array.from(speakerset);
			console.log(speakerset);
			console.log(speakerlist);
			// res.render('temp');
			//res.sendFile(__dirname+'/public/speakername.html');
			//res.render('speakername',{videofilename:videofilename, speakerlist:speakerlist}); //use STT
		}
	});
	//

}
async function createVTT(response, callback) {
	results = response.results;
	global.last_result = response.results[response.results.length - 1];
	const transcription = response.results
		.map(result => result.alternatives[0].transcript)
		.join('\n\n');
	console.log(`Transcription: ${transcription}`);
	fs.writeFile(subtitlePath, "WEBVTT\n\n", 'utf8', function (error) {
		if (err) throw err;
	});
	let VTT = "";
	let counter = 0;
	let phraseCounter = 0;
	let startTime = "00:00:00";
	let endTime = "00:00:00";
	let phrase = "";
	let speakerTag = '';

	fs.writeFile('C:/Users/wnyou/Desktop/transcription.txt', transcription, 'utf8', function (error) {
		if (err) throw err;
	});

	fs.writeFile('C:/Users/wnyou/Desktop/results.txt', secondsToFormat(JSON.stringify(last_result.alternatives[0].words)), 'utf8', function (error) {
		if (err) throw err;
	});


	//for each tracnscript
	for (var i = 0; i < results.length -1; i++) {
		try {
			// console.log(`i is ${i}`)
			// 	console.log(results[i].alternatives[0].words);
				startTime = secondsToFormat(JSON.stringify(results[i].alternatives[0].words[0].startTime.seconds.low));
				endTime = secondsToFormat(JSON.stringify(results[i].alternatives[0].words[results[i].alternatives[0].words.length - 1].endTime.seconds.low));
				phrase = results[i].alternatives[0].transcript;
				speakerTag = last_result.alternatives[0].words[counter].speakerTag;
				speakerlist.push(speakerTag);

				fs.appendFile(subtitlePath, startTime + " --> " + endTime + '\n' + speakerTag + ': ' + phrase + "\n\n", function (err) {
					if (err)
						throw err;
				});
			counter = counter + results[i].alternatives[0].words.length;
		} catch (e) {
			console.log(`다음과 같은 에러가 발생했습니다: ${e.name}: ${e.message}`);

    }

	console.log('\n\n\n')

	}
	console.log(`i is last length:: ${results.length - 1}`);
	//console.log(last_result.alternatives[0].words);


	//test
	fs.writeFile('C:/Users/wnyou/Desktop/last_result_alternatives[0]_words.txt', last_result.alternatives[0].words, 'utf8', function (error) {
		if (err) throw err;
	});

	for (var i = 0; i < last_result.alternatives[0].words.length; i++) {
		try {
			  console.log(`startTime-seconds`);
			 	console.log(last_result.alternatives[0].words[i].startTime.seconds.low);
				//console.log(secondsToFormat(JSON.stringify(last_result.alternatives[0].words[i].startTime.seconds.low));
				console.log(`endTime-seconds`);
				console.log(last_result.alternatives[0].words[i].endTime.seconds.low);
				console.log(`word`);
				console.log(last_result.alternatives[0].words[i].word);
				console.log(`speakerTag`);
				console.log(last_result.alternatives[0].words[i].speakerTag);
		} catch (e) {
			console.log(`다음과 같은 에러가 발생했습니다: ${e.name}: ${e.message}`);

		}

	console.log('\n\n\n')
	}

	callback(null);
}

async function createSpeakerVTT(callback) {
	fs.writeFile(speakerSubtitlePath, "WEBVTT\n\n", 'utf8', function (error) {
		if (err) throw err;
	});
	let VTT = "";
	let counter = 0;
	let phraseCounter = 0;
	let startTime = "00:00:00";
	let endTime = "00:00:00";
	let phrase = "";
	let speakerTag = '';

	//for each tracnscript
	for (var i = 0; i < results.length -1; i++) {
		try {
			// console.log(`i is ${i}`)
			// 	console.log(results[i].alternatives[0].words);
				startTime = secondsToFormat(JSON.stringify(results[i].alternatives[0].words[0].startTime.seconds.low));
				endTime = secondsToFormat(JSON.stringify(results[i].alternatives[0].words[results[i].alternatives[0].words.length - 1].endTime.seconds.low));
				phrase = results[i].alternatives[0].transcript;
				speakerTag='~~';

				for (const [key, value] of speakermap) {
					if(last_result.alternatives[0].words[counter].speakerTag == key){
						speakerTag = value;
					}
				}
				fs.appendFile(speakerSubtitlePath, startTime + " --> " + endTime + '\n' + speakerTag + ': ' + phrase + "\n\n", function (err) {
					if (err)
						throw err;
				});
			counter = counter + results[i].alternatives[0].words.length;
		} catch (e) {
			console.log(`다음과 같은 에러가 발생했습니다: ${e.name}: ${e.message}`);

    }

	console.log('\n\n\n')

	}
	// console.log(`i is last length:: ${results.length - 1}`);
	// console.log(last_result.alternatives[0].words);



	callback(null);
}

function speakerCount() {
	// console.log('\n\nspeakerCount!!');
	// //console.log(last_result.alternatives[0].words.length);
	//
	// var objectProperty;
	// for(var i=0;i<last_result.alternatives[0].words.length;i++){
	// 	objectProperty = 'speaker' +last_result.alternatives[0].words[i].speakerTag;
	// 	//console.log(objectProperty);
	// 	speakerlist.objectProperty = '';
	// }
	// console.log('\n\speakerlist!!');
	// console.log(speakerlist);
}

function secondsToFormat(seconds) {
	let timeHours = Math.floor(seconds / 3600).toString().padStart(2, '0');
	let timeMinutes = Math.floor(seconds / 60).toString().padStart(2, '0');
	let timeSeconds = (seconds % 60).toString().padStart(2, '0');

	let formattedTime = timeHours + ":" + timeMinutes + ":" + timeSeconds + ".000";
	return formattedTime;
}

function convert(input, output, callback) {
	ffmpeg(input)
		.output(output)
		.audioChannels(1)
		.audioFrequency(16000)
		.on('end', function () {
			//console.log('conversion ended');
			callback(null);
		}).on('error', function (err) {
			console.log('error: ', err.code, err.msg);
			callback(err);
		}).run();
}

async function uploadGCP(callback) {
	// Replace with your bucket name and filename.
	const bucketname = '2020graduationproject';
	const fname = 'sample.wav';
	const res = await storage.bucket(bucketname).upload(audioPath);
	// `mediaLink` is the URL for the raw contents of the file.
	const url = res[0].metadata.mediaLink;
	await storage.bucket(bucketname).file(`${videofilename}.wav`).makePublic();
	const axios = require('axios');
	const pkg = await axios.get(url).then(res => res.data);
	pkg.name;
	callback(null);
}


app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`)
})
