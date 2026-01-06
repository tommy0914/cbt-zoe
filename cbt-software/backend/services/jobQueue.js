const Agenda = require('agenda');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cbt-software';

const agenda = new Agenda({ db: { address: MONGO_URI, collection: 'agendaJobs' } });

module.exports = agenda;
