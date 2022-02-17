import React, { useEffect, useState } from 'react';
import { Buffer } from 'buffer';
import { Tracker } from 'meteor/tracker';
import { Accounts } from 'meteor/accounts-base';

const USER_DATA = {
  username: 'aoba',
  password: '123',
  email: 'something@gmail.com',
  profile: {
    name: 'testing',
  },
};

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Check the console.';

export const App = () => {
  const [user, setUser] = useState(null);
  const [noUserCreated, setNoUserCreated] = useState(true);
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [isLoginWithPassword, setIsLoginWithPassword] = useState(true);
  const [qrCode, setQrCode] = useState(null);
  const [code, setCode] = useState(null);
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [shouldAskCode, setShouldAskCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldAskCodeWithoutPass, setShouldAskCodeWithoutPass] = useState(
    false
  );
  const [
    shouldAskCodeWithoutPassAndToken,
    setShouldAskCodeWithoutPassAndToken,
  ] = useState(false);
  const [message, setMessage] = useState('');

  const handleError = message =>
    setErrorMessage(message || DEFAULT_ERROR_MESSAGE);

  useEffect(() => {
    Tracker.autorun(() => {
      setUser(Meteor.user());
      const cursor = Meteor.users.find();
      setNoUserCreated(!cursor.fetch().length);
    });
  }, []);

  useEffect(() => {
    const interval = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(interval);
  }, []);

  useEffect(() => {
    if (user) {
      Accounts.has2faEnabled(USER_DATA.username, (err, isEnabled) => {
        if (err) {
          setIs2faEnabled(false);
          console.error('Error verifying if user has 2fa enabled', err);
          handleError(err.reason);
          return;
        }
        setIs2faEnabled(isEnabled);
      });
    }
  }, [user, message]);

  const handleValidateCodeFromQr = () => {
    try {
      Accounts.enableUser2fa(code);
      setQrCode(null);
      setMessage('full protection activated');
      setErrorMessage('');
    } catch (err) {
      handleError(err.reason);
      console.error('Error verifying code from qr', err);
    }
  };

  const cleanState = () => {
    setIsLoginWithPassword(false);
    setQrCode(false);
    setCode(false);
    setToken(false);
    setUsername('');
    setPassword('');
    setShouldAskCode(false);
    setErrorMessage(false);
    setMessage('');
    setShouldAskCodeWithoutPass(false);
  };

  const Header = () => (
    <div className="header">
      <h1>Welcome Tester</h1>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container-loading">
        <div className="loading">
          <img alt="loading" src={'loading.gif'} />
          <h1>LOADING YOUR DATA...</h1>
        </div>
      </div>
    );
  }

  if (noUserCreated) {
    return (
      <div className="container">
        <Header />
        <div>
          <h1>Add new user</h1>
          <p>You don't have a user added to your database. Should I add it?</p>

          <button
            onClick={() => {
              Accounts.createUser(USER_DATA, error => {
                if (error) {
                  console.error('Error trying to sign in', error);
                  handleError(error.reason);
                }
              });
            }}
          >
            yes, add new user
          </button>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="container">
        <Header />
        <div>
          <h1>User info</h1>
          <p>Username: {user.username}</p>
          <p>Password: {USER_DATA.password}</p>
          <button
            onClick={() => {
              Meteor.logout(() => {
                cleanState();
              });
            }}
          >
            Log out
          </button>
        </div>

        <div>
          <h1>2FA</h1>
          {is2faEnabled && (
            <button
              onClick={() => {
                Accounts.disableUser2fa(() => {
                  setMessage('2FA disabled');
                });
              }}
            >
              disable 2fa
            </button>
          )}
          {!is2faEnabled && !qrCode && (
            <button
              onClick={() => {
                Accounts.generate2faActivationQrCode(
                  'Testing app name',
                  (err, svg) => {
                    if (err) {
                      console.error('Error trying to log in', err);
                      handleError(err.reason);
                      return;
                    }
                    setErrorMessage('');
                    setQrCode(Buffer.from(svg).toString('base64'));
                  }
                );
              }}
            >
              Generate a new QR code
            </button>
          )}
        </div>
        {qrCode && (
          <div className="qr-code-container">
            <img
              alt="qr code"
              width="200"
              src={`data:image/svg+xml;base64,${qrCode}`}
            />
            <div className="qr-code-fields">
              <input
                onChange={({ target: { value } }) => setCode(value)}
                placeholder="2FA code"
              />
              <button onClick={handleValidateCodeFromQr}>validate</button>
            </div>
          </div>
        )}

        {message && <div>{message}</div>}
        {errorMessage && <div className="error">{errorMessage}</div>}
      </div>
    );
  }

  return (
    <div className="container">
      <Header />

      <div className="toggle-button-container">
        <button
          className="toggle-button"
          onClick={() => {
            setShouldAskCode(false);
            setShouldAskCodeWithoutPass(false);
            setShouldAskCodeWithoutPassAndToken(false);

            setIsLoginWithPassword(!isLoginWithPassword);
          }}
        >
          {isLoginWithPassword ? 'Login with token' : 'Login with password'}
        </button>
      </div>

      {isLoginWithPassword ? (
        <div>
          <div>
            <input
              onChange={({ target: { value } }) => setUsername(value)}
              placeholder="Username"
            />
            <input
              onChange={({ target: { value } }) => setPassword(value)}
              type="password"
              placeholder="Password"
            />
            {!shouldAskCode && (
              <button
                onClick={() => {
                  Meteor.loginWithPassword(username, password, error => {
                    if (error) {
                      if (error.error === 'no-2fa-code') {
                        setShouldAskCode(true);
                        return;
                      }
                      console.error(
                        'Error trying to log in (user without 2fa)',
                        error
                      );
                      handleError(error.reason);
                      return;
                    }
                    cleanState();
                  });
                }}
              >
                login
              </button>
            )}
          </div>
          {shouldAskCode && (
            <div>
              <input
                onChange={({ target: { value } }) => setCode(value)}
                placeholder="Code"
              />
              <button
                onClick={() => {
                  Meteor.loginWithPasswordAnd2faCode(
                    username,
                    password,
                    code,
                    error => {
                      if (error) {
                        console.error(
                          'Error trying to log in (user WITH 2fa)',
                          error
                        );
                        handleError(error.reason);
                        return;
                      }
                      cleanState();
                    }
                  );
                }}
              >
                validate
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div>
            <p>
              Logging in user <b>{USER_DATA.username}</b> with token
            </p>
            <span>
              Check which token you should use on the server logs, after
              clicking the button below
            </span>
          </div>

          {!shouldAskCodeWithoutPass && !shouldAskCodeWithoutPassAndToken && (
            <button
              onClick={() => {
                Accounts.requestLoginTokenForUser(
                  { selector: USER_DATA.email },
                  err => {
                    if (err) {
                      console.error('Error requestLoginTokenForUser', err);
                      handleError(err.reason);
                      return;
                    }
                    setShouldAskCodeWithoutPass(true);
                  }
                );
              }}
            >
              Generate Token
            </button>
          )}

          {(shouldAskCodeWithoutPass || shouldAskCodeWithoutPassAndToken) && (
            <div>
              <input
                onChange={({ target: { value } }) => setToken(value)}
                placeholder="token"
              />
              {shouldAskCodeWithoutPassAndToken ? (
                <div>
                  <input
                    onChange={({ target: { value } }) => setCode(value)}
                    placeholder="2fa code"
                  />

                  <button
                    onClick={() => {
                      Meteor.passwordlessLoginWithTokenAnd2faCode(
                        USER_DATA.email,
                        token,
                        code,
                        error => {
                          if (error) {
                            console.error(
                              'Error trying to log in (passwordlessLoginWithToken)',
                              error
                            );
                            handleError(error.reason);
                            return;
                          }
                          cleanState();
                        }
                      );
                    }}
                  >
                    validate
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    Meteor.passwordlessLoginWithToken(
                      USER_DATA.email,
                      token,
                      error => {
                        if (error) {
                          if (error.error === 'no-2fa-code') {
                            setShouldAskCodeWithoutPassAndToken(true);
                            return;
                          }
                          console.error(
                            'Error trying to log in (passwordlessLoginWithToken)',
                            error
                          );
                          handleError(error.reason);
                          return;
                        }
                        cleanState();
                      }
                    );
                  }}
                >
                  validate
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {errorMessage && <div className="error">{errorMessage}</div>}
    </div>
  );
};
