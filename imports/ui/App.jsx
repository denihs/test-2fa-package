import React, {useEffect, useState} from 'react';
import { Buffer } from "buffer";
import { Tracker } from 'meteor/tracker';
import { Accounts } from 'meteor/accounts-base';

export const App = () => {

  const [user, setUser] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [code, setCode] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [shouldAskCode, setShouldAskCode] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Tracker.autorun(() => {
      setUser(Meteor.user())
    });
  }, [])

  const handleValidateCodeFromQr = () => {
    try {
      Accounts.enableUser2fa(code);
      setQrCode(null);
      setMessage("full protection activated");
    } catch (err) {
      console.error('Error verifying code from qr', err);
    }
  }

  return (
    <div>
      <h1>Welcome! To the internet</h1>

      {user ?
        <div>
          {JSON.stringify(user)}
          <button
            onClick={() => {
              Meteor.logout();
              setMessage("");
            }}
          >
            Get me out of here
          </button>
          <button
            onClick={() => {
              Accounts.generateSvgCodeAndSaveSecret((err, svg) => {
                if (err) {
                  console.error("Error trying to log in", err);
                  return;
                }
                setQrCode(Buffer.from(svg).toString('base64'));
              })
            }}
          >
            get me a code
          </button>
          <button
            onClick={() => {
              Accounts.disableUser2fa()
            }}
          >
            disable 2fa
          </button>
        </div> :
        <div>
          <input onChange={({target: {value}}) => setUsername(value)}/>
          <input onChange={({target: {value}}) => setPassword(value)} type="password"/>

      <button onClick={() => {
        Accounts.has2FAEnabled(username, (err, isEnabled) => {
          if (err) {
            console.error("Error verifying if user has 2fa enabled", err);
            return;
          }

          if (isEnabled) {
            setShouldAskCode(true);
            return;
          }
          Meteor.loginWithPassword(username, password, error => {
            if (error) {
              console.error("Error trying to log in (user without 2fa)", error);
            }
          });
        });
      }
      }>login?</button>

          {shouldAskCode && <div>
            <input onChange={({target: {value}}) => setCode(value)}/>
            <button onClick={() => {
              Meteor.loginWithPassword(username, password, code,error => {
                if (error) {
                  console.error("Error trying to log in (user WITH 2fa)", error);
                }
              })}
            }>validate</button>
          </div>}
        <button onClick={() => {
          Accounts.createUser({
            username: "aoba",
            password: "123",
            email: "something@gmail.com",
            profile: {
              name:"testing"
            }
          }, (error) => {
            if (error) {
              console.error("Error trying to sign in", error)
            }
          })
        }
        }>create something?</button>
      </div> }

      {qrCode && <div>

      <img
        alt="qr code"
        width="200"
        src={`data:image/svg+xml;base64,${qrCode}`}
      />
        <input onChange={({target: {value}}) => setCode(value)}/>
        <button onClick={handleValidateCodeFromQr}>validate</button>
      </div>
      }

      {message && <div>{message}</div>}
    </div>
  );
};
