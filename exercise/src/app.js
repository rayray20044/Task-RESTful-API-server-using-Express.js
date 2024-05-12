import express from 'express';
import {read, write} from './tools/json-files.js';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || '12345';

const users = [
    { id: 1, userName: 'Max', password: '123' },
    { id: 2, userName: 'Iris', password: '123' },
];

const generateToken = (users) => {
    return jwt.sign({id: users.id, userName: users.userName}, '12345', {expiresIn: '1h'});
};

const authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlck5hbWUiOiJJcmlzIiwiaWF0IjoxNzE1MjU3MTM0LCJleHAiOjE3MTUyNjA3MzR9.ViHh-koscdpq-pZGYDbsg9mhHIOyMJ6zf83IrX28WOQ')[1];
        jwt.verify(token, '12345', (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};


const questionsWithAnswers = [
    {
        "id": "544db309-40cf-4dd8-8662-c10ed3502a5d",
        "correctAnswer": 0
    },
    {
        "id": "0c09e601-3f13-4d46-8895-6a03fff9d669",
        "correctAnswer": 2
    },
    {
        "id": "e1963847-7a09-4a6f-9501-817a6aad0648",
        "correctAnswer": 2
    },
    {
        "id": "0b7718ed-f864-42fc-a841-e594cef004eb",
        "correctAnswer": 2
    },
    {
        "id": "df8c6911-9807-44e2-91fd-9fe8b4ca8fd1",
        "correctAnswer": 3
    },
    {
        "id": "5307e4a7-69f3-4fa5-8106-21e6de602c94",
        "correctAnswer": 1
    },
    {
        "id": "60b0c992-4b76-4351-9109-0e185c7b831e",
        "correctAnswer": 1
    },
    {
        "id": "2212292e-2312-4737-ba1e-10697be65c78",
        "correctAnswer": 2
    },
    {
        "id": "d9ae5c43-6666-4532-944b-40309175d324",
        "correctAnswer": 0
    },
    {
        "id": "5d1d70a9-39b6-4e20-b2b5-31f4e893c39c",
        "correctAnswer": 2
    }
];

app.get('/game-runs/:runId/results', (req, res) => {
    const { runId } = req.params;
    const gameRuns = read('game-runs.json');
    const gameRun = gameRuns.find(run => run.id === runId);

    if (!gameRun) {
        return res.status(404).json({ error: 'Game run not found.' });
    }

    const responsesWithCorrectness = {};
    for (const [questionId, userAnswerIndex] of Object.entries(gameRun.responses)) {
        const question = questionsWithAnswers.find(q => q.id === questionId);
        if (!question) {
            return res.status(400).json({ error: `Question ${questionId} not found.` });
        }
        const isCorrect = userAnswerIndex === question.correctAnswer;
        responsesWithCorrectness[questionId] = isCorrect;
    }

    res.json({
        id: gameRun.id,
        userName: gameRun.userName,
        createdAt: gameRun.createdAt,
        responses: responsesWithCorrectness
    });
});


app.post('/authenticate', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.userName === username && u.password === password);
    if (user) {
        const token = generateToken(user);
        res.json({ token });
    } else {
        res.sendStatus(401);
    }
});



const readQuestionsData = () => {
    try {
        const questionsData = fs.readFileSync('/Users/rayan/Documents/GitHub/suse24-api-exercise/data/questions.json', 'utf8');
        return JSON.parse(questionsData);
    } catch (error) {
        console.error('Error reading questions data:', error);
        return [];
    }
};

//const for /game-runs/{runId}/responses

const authorizeUser = (req, res, next) => {
    const userId = req.user.id;
    const runId = req.params.runId;
    const user = users.find(u => u.id === userId);
    console.log('User:', user); // Log the user object for debugging
    if (!user || !user.gameRuns || !user.gameRuns.includes(runId)) {
        return res.sendStatus(403);
    }
    next();
};

app.post('/game-runs', (req, res) => {
    const gameRuns = [];
    const runId = uuid();
    const userName = "Iris";
    const createdAt = Math.floor(Date.now() / 1000);

    const newGameRun = {
        id: runId,
        userName: userName,
        createdAt: createdAt,
        responses: {}
    };

    gameRuns.push(newGameRun);

    res.json({ runId: runId });
});

function generateUniqueId() {
    return uuid();
}

app.get('/questions', (req, res) => {
    try {
        const questions = readQuestionsData();
        res.status(200).json(questions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/questions/:questionId', (req, res) => {
    const { questionId } = req.params;
    const questions = readQuestionsData();
    const question = questions.find(q => q.id === questionId);

    if (!question) {
        return res.status(404).json({ error: 'Question not found' });
    }

    const { id, question: questionText, options } = question;
    res.json({ id, question: questionText, options });
});

app.put('/game-runs/:runId/responses', (req, res) => {
    const gameRuns = read('game-runs.json');
    const { runId } = req.params;
    const newResponses = req.body;

    const gameRunIndex = gameRuns.findIndex(run => run.id === runId);

    if (gameRunIndex === -1) {
        return res.status(404).json({ error: 'Game run not found.' });
    }

    const gameRun = gameRuns[gameRunIndex];
    gameRun.responses = {
        ...gameRun.responses,
        ...newResponses,
    };

    write('game-runs.json', gameRuns);
    res.json(gameRun);
});


export default app;

