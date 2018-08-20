import React, { Component} from 'react';
import PropTypes from 'prop-types';
import 'aws-sdk';
import "./styles/chatbot.css";


class LexChat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: '', 
      lexUserId: 'chatbot-demo' + Date.now(), 
      sessionAttributes: {}, visible: 'closed'
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    document.getElementById("inputField").focus();
    AWS.config.region = this.props.region || 'us-east-1';
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: this.props.IdentityPoolId,
    });
    var lexruntime = new AWS.LexRuntime();
    this.lexruntime = lexruntime;

  }

  handleClick() {
    this.setState({ visible: this.state.visible == 'open'? 'closed' : 'open' });
    console.log(this.state);
  }

  pushChat(event) {
    event.preventDefault();

    var inputFieldText = document.getElementById('inputField');

    if (inputFieldText && inputFieldText.value && inputFieldText.value.trim().length > 0) {

      // disable input to show we're sending it
      var inputField = inputFieldText.value.trim();
      inputFieldText.value = '...';
      inputFieldText.locked = true;

      // send it to the Lex runtime
      var params = {
        botAlias: '$LATEST',
        botName: this.props.botName,
        inputText: inputField,
        userId: this.state.lexUserId,
        sessionAttributes: this.state.sessionAttributes
      };
      this.showRequest(inputField);
      var a = function(err, data) {
        if (err) {
          console.log(err, err.stack);
          this.showError('Error:  ' + err.message + ' (see console for details)')
        }
        if (data) {
          // capture the sessionAttributes for the next cycle
          this.setState({sessionAttributes: data.sessionAttributes})
          //sessionAttributes = data.sessionAttributes;
          // show response and/or error/dialog status
          this.showResponse(data);
        }
        // re-enable input
        inputFieldText.value = '';
        inputFieldText.locked = false;
      };

      this.lexruntime.postText(params, a.bind(this));
    }
    // we always cancel form submission
    return false;
  }

  showRequest(daText) {
    var conversationDiv = document.getElementById('conversation');
    var requestPara = document.createElement("P");
    requestPara.className = 'userRequest';
    requestPara.appendChild(document.createTextNode(daText));
    conversationDiv.appendChild(requestPara);
    conversationDiv.scrollTop = conversationDiv.scrollHeight;
  }

  showError(daText) {

    var conversationDiv = document.getElementById('conversation');
    var errorPara = document.createElement("P");
    errorPara.className = 'lexError';
    errorPara.appendChild(document.createTextNode(daText));
    conversationDiv.appendChild(errorPara);
    conversationDiv.scrollTop = conversationDiv.scrollHeight;
  }

  showResponse(lexResponse) {
    var conversationDiv = document.getElementById('conversation');
    var responsePara = document.createElement("P");
    responsePara.className = 'lexResponse';
    if (lexResponse.message) {
      var indexOfLink = lexResponse.message.indexOf("http");
      if (indexOfLink !== -1){
        var link = lexResponse.message.substring(indexOfLink);
        var a = document.createElement('a');
        var linkText = document.createTextNode("here");
        a.appendChild(linkText);
        a.title = "iCARE Help";
        a.href = link;
        a.target = "_blank";

        responsePara.appendChild(document.createTextNode("Click "));
        responsePara.appendChild(a);
        responsePara.appendChild(document.createTextNode(" for help on our iCARE site."));
      }
      else {
        responsePara.appendChild(document.createTextNode(lexResponse.message));
      }
      responsePara.appendChild(document.createElement('br'));
    }
    if(lexResponse.responseCard){
      var buttonGroup = document.createElement('div');
      buttonGroup.id = 'buttonGroup';
      for (let x of lexResponse.responseCard.genericAttachments[0].buttons){
        var button = document.createElement('button');
        var buttonText = document.createTextNode(x.text);
        button.appendChild(buttonText);
        button.value = x.value;
        button.onclick = (e) => {
          document.getElementById('inputField').value = e.target.value;
          this.pushChat(e);
          document.getElementById('buttonGroup').hidden = true;
        };
        buttonGroup.appendChild(button);
      }
      responsePara.appendChild(buttonGroup);
    }
    if (lexResponse.dialogState === 'ReadyForFulfillment') {
      responsePara.appendChild(document.createTextNode(
        'Ready for fulfillment'));
      // TODO:  show slot values
    } else {
      responsePara.appendChild(document.createTextNode(
        ''));
    }
    conversationDiv.appendChild(responsePara);
    conversationDiv.scrollTop = conversationDiv.scrollHeight;
  }

  handleChange(event) {
    event.preventDefault();
    this.setState({data: event.target.value});
  }

  render() {

    const inputStyle = {
      padding: '3px',
      fontSize: 15,
      width: '294px',
      height: '30px',
      borderRadius: '1px',
      border: '7px'
    }

    const conversationStyle = {
      width: '300px',
      height: this.props.height,
      border: 'px solid #ccc',
      backgroundColor: this.props.backgroundColor,
      padding: '3px',
      overflow: 'scroll',
      borderBottom: 'thin ridge #bfbfbf'
    }

    const headerRectStyle = {
      backgroundColor: '#FFFFFF', 
      borderTop: '2px solid #66AFE9',
      borderLeft: '2px solid #66AFE9',
      borderRight: '2px solid #66AFE9',
      boxShadow: '0 0 5px #C7D9E8',
      width: '306px', 
      height: '30px',
      textAlign: 'center',
      paddingTop: 9,
      paddingBottom: -9,
      color: '#333333',
      fontSize: '18px'
    }

    const chatcontainerStyle = {
      backgroundColor: '#FFFFFF',
      borderLeft: '2px solid #66AFE9',
      borderRight: '2px solid #66AFE9',
      boxShadow: '0 0 5px #C7D9E8',
      width: 306
    }

    const chatFormStyle = {
      margin: '1px', 
      padding: '2px'
    }


    return (
      <div id="chatwrapper">
        <div id="chat-header-rect" style={headerRectStyle} onClick={this.handleClick} >{this.props.headerText}
              {(this.state.visible === 'open') ? <span className='chevron bottom'></span> : <span className='chevron top'></span>}
        </div>
        <div id="chatcontainer" className={this.state.visible} style={chatcontainerStyle}>
          <div id="conversation" style={conversationStyle} ></div>
            <form id="chatform" style={chatFormStyle} onSubmit={this.pushChat.bind(this)}>
                <input type="text"
                       id="inputField"
                       size="30"
                       value={this.state.data}
                       placeholder={this.props.placeholder}
                       onChange={this.handleChange.bind(this)}
                       style={inputStyle}
                      />
            </form>
        </div>
      </div>
    )
  }
}

LexChat.propTypes = {
  botName: PropTypes.string,
  IdentityPoolId: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  backgroundColor: PropTypes.string,
  height: PropTypes.number,
  headerText: PropTypes.string
}

export default LexChat;

