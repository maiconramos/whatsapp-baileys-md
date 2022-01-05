/**
 * Maicon Ramos
 * maiconramos.com 
 **/

import makeWASocket, { useSingleFileAuthState, AnyMessageContent, AnyMediaMessageContent, delay,  } from '@adiwajshing/baileys-md'
const { BufferJSON, initInMemoryKeyStore, DisconnectReason, MessageType,
  MessageOptions, Mimetype } = require("@adiwajshing/baileys-md")
const { state, saveState } = useSingleFileAuthState('./auth_info_multi.json')
const express = require('express');
const http = require('http');
const app = express();
const fs = require('fs');
const port = process.env.PORT || 8001;
const server = http.createServer(app);
const { body, validationResult } = require('express-validator');

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
})

const sendMessageWTyping = async(msg: AnyMessageContent, jid: string) => {
    await sock.presenceSubscribe(jid)
    await delay(500)

    await sock.sendPresenceUpdate('composing', jid)
    await delay(2000)

    await sock.sendPresenceUpdate('paused', jid)

    await sock.sendMessage(jid, msg)
}

sock.ev.on('connection.update', (update) => {
    const { connection } = update
    if(connection === 'close') {
        console.log('closed connection')
    } else if(connection === 'open') {
        console.log('opened connection')
    }
})

// Escutando comando teste para responder automaticamente
sock.ev.on('messages.upsert', async m => {
    //console.log(JSON.stringify(m, undefined, 2))
    const msg = m.messages[0]
    const body = m.messages[0].message.conversation
    if(!msg.key.fromMe && m.type === 'notify' && body === 'teste') {
        console.log('Enviando mensagem para: ', m.messages[0].key.remoteJid)
        sendMessageWTyping({ text: 'Oie, isso é um teste. \n👨‍🏫 tudo bem?' }, msg.key.remoteJid)
    } 
    if(!msg.key.fromMe && m.type === 'notify' && body === 'teste2') {
        console.log('Enviando mensagem para: ', m.messages[0].key.remoteJid)
        console.log( m.messages[0].message.conversation)
        sendMessageWTyping({ text: '🔥 Teste 2' }, msg.key.remoteJid)
    }
    if(!msg.key.fromMe && m.type === 'notify' && body === 'teste3') {
        console.log('Enviando mensagem para: ', m.messages[0].key.remoteJid)
        console.log( m.messages[0].message.conversation)
        sendMessageWTyping({ text: '✅ teste 3' }, msg.key.remoteJid)
    }      
})

sock.ev.on('messages.update', m => console.log(m))
sock.ev.on('presence.update', m => console.log(m))
sock.ev.on('chats.update', m => console.log(m))
sock.ev.on('contacts.update', m => console.log(m))

sock.ev.on ('creds.update', saveState)

async function formatNumber(number) {
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);
  if (numberDDD <= 30) {
    const numberOK = numberDDI + numberDDD + "9" + numberUser + "@s.whatsapp.net";
    return numberOK;
  }else{
    const numberOK = numberDDI + numberDDD + numberUser + "@s.whatsapp.net";
    return numberOK;
  }
}

// APP // POST // SendText
app.post('/send-message', [
        body('number').notEmpty(),
        body('message').notEmpty(),
      ], async (req, res) => {

      const errors = validationResult(req).formatWith(({   msg
      }) => {
      return msg;
      });

      if (!errors.isEmpty()) {
      return res.status(422).json({
      status: false,
      message: errors.mapped()
      });
      }

      // Tratar número
      const number = await formatNumber(req.body.number);

      const message = { text: req.body.message };

      await sendMessageWTyping(message, number).then(response => {
      res.status(200).json({
        status: true,
        message: 'Mensagem enviada',
        response: response
      });
      }).catch(err => {
      res.status(500).json({
        status: false,
        message: 'Mensagem não enviada',
        response: err.text
      });
      });
})

// APP // POST // SendMedia
app.post('/send-media', [
    body('number').notEmpty(),
    body('file').notEmpty(),
    body('caption').notEmpty(),
  ], async (req, res) => {

  const errors = validationResult(req).formatWith(({
  msg
  }) => {
  return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
    status: false,
    message: errors.mapped()
    });
  }
  
  // Tratar número
  const number = await formatNumber(req.body.number);

  // Montar Objeto da Media
  const arquivo = {
      image: {url: req.body.file},
      caption: req.body.caption
  }

  await sock.sendMessage(number,arquivo)
    .then(response => {
      res.status(200).json({
        status: true,
        message: 'Mensagem enviada',
        response: response
    });
  }).catch(err => {
  res.status(500).json({
    status: false,
    message: 'Imagem não enviada ' + err,
    response: err.text
  });
  });
})

// APP // POST // SendPDF
app.post('/send-pdf', [
    body('number').notEmpty(),
    body('file').notEmpty(),
  ], async (req, res) => {

  const errors = validationResult(req).formatWith(({
  msg
  }) => {
  return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
    status: false,
    message: errors.mapped()
    });
  }
  
  // Tratar número
  const number = await formatNumber(req.body.number);
  const file = req.body.file;

  await sock.sendMessage(number, { document: { url: file }, fileName: "Saiba Mais.pdf", mimetype: "application/pdf" , ptt : true })
    .then(response => {
      res.status(200).json({
        status: true,
        message: 'Mensagem enviada',
        response: response
    });
  }).catch(err => {
  res.status(500).json({
    status: false,
    message: 'Imagem não enviada ' + err,
    response: err.text
  });
  });
})

// APP // POST // SendButton
app.post('/send-button', [
    body('number').notEmpty(),
    body('title').notEmpty(),
    body('footer'),
    body('btn1').notEmpty(),
    body('btn2').notEmpty(),
    body('btn3').notEmpty(),
  ], async (req, res) => {

  const errors = validationResult(req).formatWith(({
  msg
  }) => {
  return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
    status: false,
    message: errors.mapped()
    });
  }
  
  // Tratar número
  const number = await formatNumber(req.body.number);



  // Montar opcoes do botao
  const buttons = [
    {buttonId: 'id1', buttonText: {displayText: req.body.btn1}, type: 1},
    {buttonId: 'id2', buttonText: {displayText: req.body.btn2}, type: 1},
    {buttonId: 'id3', buttonText: {displayText: req.body.btn3}, type: 1}
  ]
  // Montar objeto do template do botao
  const buttonMessage = {
      text: req.body.title,
      footer: req.body.footer,
      buttons: buttons,
      headerType: 1
  }
  
  await sock.sendMessage(number , buttonMessage)
    .then(response => {
      res.status(200).json({
        status: true,
        message: 'Mensagem enviada',
        response: response
    });
  }).catch(err => {
  res.status(500).json({
    status: false,
    message: 'Imagem não enviada ' + err,
    response: err.text
  });
  });
})

server.listen(port, function() {
    console.log('App running on *: ' + port);
});