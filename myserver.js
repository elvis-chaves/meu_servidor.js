const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Airtable = require('airtable');
//const favicon = require('serve-favicon');
const path = require('path');
require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Adicione esta linha para servir o favicon
//app.use(favicon(path.join(__dirname, 'favicon.ico')));

// Configuração do Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const table = process.env.AIRTABLE_TABLE_NAME_APPOINTMENTS;

let appointments = [];

// Função para carregar agendamentos do Airtable
const loadAppointments = async () => {
  try {
    const records = await base(table).select().all();
    appointments = records.map(record => ({
      id: record.id,
      ...record.fields
    }));
  } catch (error) {
    console.error('Erro ao carregar agendamentos:', error);
  }
};

// Inicialmente carrega os agendamentos ao iniciar o servidor
loadAppointments();

// Endpoint para obter horários disponíveis
app.get('/available-times', async (req, res) => {
  const { date } = req.query;
  const times = [];
  for (let hour = 8; hour < 19; hour++) {
    for (let minute = 0; minute < 60; minute += 20) {
      times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  const appointmentsForDate = appointments.filter(app => app.data === date).map(app => app.horario);
  const availableTimes = times.filter(time => !appointmentsForDate.includes(time));
  res.json(availableTimes);
});

// Endpoint para criar um novo agendamento
app.post('/appointments', async (req, res) => {
  const { nome, modalidade, data, horario } = req.body;
  const newAppointment = {
    nome,
    modalidade,
    data,
    horario,
  };
  try {
    const createdRecord = await base(table).create(newAppointment);
    appointments.push({
      id: createdRecord.id,
      ...createdRecord.fields,
    });
    res.status(200).json(createdRecord);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).send('Erro ao criar agendamento');
  }
});

// Endpoint para obter agendamentos de uma data específica
app.get('/appointments', async (req, res) => {
  const { date } = req.query;
  const appointmentsForDate = appointments.filter(app => app.data === date);
  res.json(appointmentsForDate);
});

// Endpoint para cancelar um agendamento
app.delete('/appointments/:id', async (req, res) => {
  const { id } = req.params;
  appointments = appointments.filter(app => app.id !== id);
  try {
    await base(table).destroy([id]);
    res.status(200).send('Agendamento cancelado');
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    res.status(500).send('Erro ao cancelar agendamento');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

/*const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');
const port = 3000;

const AIRTABLE_API_KEY = 'patdzCpbsjnS2w1XQ.e26e37d305fc4165e214951cd98048eb02dc173971b3fbe1d4c50e23e6e4ca95';
const AIRTABLE_BASE_ID = 'appLOspq80uiEAad9';
const AIRTABLE_TABLE_NAME_APPOINTMENTS = 'Agendamentos';

app.use(cors());
app.use(express.json());
app.get('/available-times', (req, res) => {
  const times = generateAvailableTimes();
  res.json(times);
});

// Função para gerar horários disponíveis
function generateAvailableTimes() {
  
  const times = [];
  let currentTime = new Date();
  currentTime.setHours(8, 0, 0, 0); // Inicia às 8:00

  while (currentTime.getHours() < 19 || (currentTime.getHours() === 19 && currentTime.getMinutes() === 0)) {
    times.push(`${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`);
    currentTime.setMinutes(currentTime.getMinutes() + 20);
  }

  return times;
}
// Endpoint para retornar horários disponíveis
app.get('/available-times', async (req, res) => {
  try {
    //primeiro passo
    //passar a data selecionada 

    //segundo passo 
    //usar a data selecionada como paremetro do where para retornar todos os horarios desta data

    //terceiro passo
    //usar a lista de horarios retornados para retirar das lista de hoarios disponiveis

    const timeslots = generateAvailableTimes();
    res.json(timeslots);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao buscar horários disponíveis');
  }
});

// Endpoint para retornar agendamentos para uma data específica
app.get('/appointments', async (req, res) => {
  const { date } = req.query;
  console.log(date);
  console.log(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME_APPOINTMENTS}?filterByFormula=DATETIME_FORMAT({Data}, "YYYY-MM-DD") = "${date}"`)
  try {
    const response = await axios.get(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME_APPOINTMENTS}?filterByFormula=DATETIME_FORMAT({Data}, "YYYY-MM-DD") = "${date}"`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    const appointments = response.data.records.map(record => ({
      id: record.id,
      nome: record.fields.Nome,
      modalidade: record.fields.Modalidade,
      data: record.fields.Data,
      horario: record.fields.Horário,
    }));
    console.log(appointments);
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao buscar agendamentos');
  }
});

// Endpoint para criar um novo agendamento
app.post('/appointments', async (req, res) => {
  const { nome, modalidade, data, horario } = req.body;
  console.log(nome,modalidade,data,horario)
  try {
    const response = await axios.post(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME_APPOINTMENTS}`, {
      fields: {
        Nome: nome,
        Modalidade: modalidade,
        Data: data,
        Horário: horario,
      }
    }, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao criar agendamento');
  }
});

// Endpoint para cancelar um agendamento
app.delete('/appointments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await axios.delete(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME_APPOINTMENTS}/${id}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    res.status(200).send('Agendamento cancelado com sucesso');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao cancelar agendamento');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`)
  
});
*/