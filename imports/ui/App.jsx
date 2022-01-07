import React, {useEffect, useState} from 'react';
import { Tracker } from 'meteor/tracker';
import { Accounts } from 'meteor/accounts-base';

export const App = () => {

  const [user, setUser] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [code, setCode] = useState(null);
  const [validateCode, setHandleValidateCode] = useState(null);

  useEffect(() => {
    Tracker.autorun(() => {
      setUser(Meteor.user())
    });
  }, [])

  const handleValidateCode = () => {
    try {
      if (validateCode) {
        validateCode(code);
      }
    } catch (err) {
      console.error('Error verifying code', err);
    }
  }
  const handleValidateCodeFromQr = () => {
    try {
      Accounts.enableUser2fa(code);
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
            onClick={() => Meteor.logout()}
          >
            Get me out of here
          </button>
          <button
            onClick={() => {
              Accounts.generateSvgCode((err, svg) => {
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
        </div> :
        <div>
        no use at all my man
      <button onClick={() => {
        Meteor.loginWithPassword("aoba", "123", (error, validateCodeAndAuthenticate) => {
          if (error) {
            console.error("Error trying to log in", error);
            return;
          }

          setHandleValidateCode(() => validateCodeAndAuthenticate);
        })
      }
      }>login?</button>

          {validateCode && <div>
            <input onChange={({target: {value}}) => setCode(value)}/>
            <button onClick={handleValidateCode}>validate</button>
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
    </div>
  );
};
