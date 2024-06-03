document.addEventListener('DOMContentLoaded', function() {
  
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email); 
  
  document.querySelector('#compose-form').onsubmit = function() {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector("#compose-recipients").value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
        load_mailbox('sent');
    })
    .catch(err => console.error(err));

    return false;
  }

  // By default, load the inbox
  load_mailbox('inbox');
  
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-display').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-display').style.display = 'none';
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  const url = `/emails/${mailbox}`;
  fetch(url)
  .then(response => response.json())
  .then(emails => {
    // Print emails
    //console.log(emails);
    if (emails.length !== 0) {
      emails.forEach(email => {
        if(mailbox === 'inbox' || mailbox === 'archive'){
          load_inarch(email,mailbox);
        }
        else{
          load_sent(email);
        }
      });
    }
  });
} 


function load_inarch(email,mailbox) {
  const recipients = email.recipients;
  const subject = email.subject;
  const timestamp = email.timestamp;
  const emailid = email.id;
  let buttonvalue = 'Archive';
  if(mailbox === 'archive'){
    buttonvalue = 'Unarchive';
  }
  const sender = email.sender;
  const newdiv = document.createElement('div');
  newdiv.setAttribute('id', 'border');
  newdiv.innerHTML = `<div class="row" onclick="viewEmail(${emailid})">
                          <div class="col-lg-8 email">
                              <p> <b>${sender}</b>
                                  &nbsp&nbsp ${subject}
                                  <span style="float: right; color:#646970;">${timestamp}</span>
                              </p>
                          </div>
                          <div class="col-lg-4">
                            <button class="archive" onclick="setarchive(${emailid})">${buttonvalue}</button>
                          </div>
                      </div>`;
  if(email.read === true){
    newdiv.style.backgroundColor = '#dcdcde';
  }
  document.querySelector('#emails-view').append(newdiv);
}


function setarchive(emailid) {
  if (document.querySelector('.archive').innerHTML ==='Archive'){
    document.querySelector('.archive').innerHTML = 'Unarchive';
    fetch(`/emails/${emailid}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: true
      })
    });
  }
  else {
    document.querySelector('.archive').innerHTML = 'Archive';
    fetch(`/emails/${emailid}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: false
      })
    });
  }
  window.location.reload();
}


function load_sent(email) {
  const recipients = email.recipients;
  const subject = email.subject;
  const timestamp = email.timestamp;
  const emailid = email.id;

  recipients.forEach(recipient => {
    const newdiv = document.createElement('div');
    newdiv.setAttribute('id', 'border');
    newdiv.innerHTML = `<div class="row" onclick="viewEmail(${emailid})">
                          <div class="col-lg-12 email">
                              <p><b>${recipient}</b>
                                &nbsp&nbsp ${subject}
                                <span style="float: right; color:#646970;">${timestamp}</span>
                              </p>
                          </div>
                        </div>`;
    document.querySelector('#emails-view').append(newdiv);
  });
}


function viewEmail(emailid) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-display').style.display = 'block';
  
  fetch(`/emails/${emailid}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  });

  fetch(`/emails/${emailid}`)
  .then(response => response.json())
  .then(email => {
    // Print email
    //console.log(email);
    const sender = email.sender;
    const recipients = email.recipients;
    const subject = email.subject;
    let nbody = email.body;
    const body = nbody.replace(/\n/g, '<br />');
    const timestamp = email.timestamp;
    const line = document.createElement('hr');
    const newDiv = document.createElement('div');
    newDiv.innerHTML=`<div class="row"> 
                        <div class="col-lg-6">
                        <p><b>From:</b> ${sender}</p>
                          <p><b>To:</b> ${recipients}</p>
                          <p><b>Subject:</b> ${subject}</p>
                          <p><b>Timestamp:</b> ${timestamp}</p>
                          <p><button class="reply" onclick="compose_reply(${emailid})">Reply</button></p>
                        </div>
                      </div>
                      ${line.outerHTML}
                      <div class="row">
                        <div class="col-lg-6">
                          <p>${body}<p>
                        </div>
                      </div>`;
    document.querySelector('#email-display').innerHTML = newDiv.innerHTML;
  });
}


function compose_reply(emailid) {

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-display').style.display = 'none';

  fetch(`/emails/${emailid}`)
  .then(response => response.json())
  .then(email => {
    const sender = email.sender;
    const subject = email.subject;
    const body = email.body;
    const timestamp = email.timestamp;
    const h3 = document.querySelector('#heading');
    h3.innerHTML = 'Reply';
    document.querySelector('#compose-recipients').value = sender;
    if (!subject.includes('Re:')){
      document.querySelector('#compose-subject').value = `Re: ${subject}`;
    } else {
      document.querySelector('#compose-subject').value = subject;
    }
    document.querySelector('#compose-body').value = `\nOn ${timestamp} ${sender} wrote:\n${body}\n`;
  });
}

