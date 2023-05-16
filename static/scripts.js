// Add this variable at the beginning of the script
let chatHistory = [];

$(document).ready(function() {
    let $messageInput = $('#message-input');
    let $chatHistory = $('#chat-history');
    let $sendMessage = $('#send-message');
    let $modelSelector = $('#model-selector'); // Add this line to get a reference to the model selector
    let $maxlengthslider = $('#max-length-slider');
    let $temperatureslider = $('#temperature-slider');
    let filename = null;

    function appendMessage(role, content) {
        let $message = $('<p>');
        let iconClass = role === 'user' ? 'fas fa-user' : 'fas fa-robot';
      
        if (role === 'user') {
          $message.addClass('user-message');
          const formattedContent = formatMarkdown(content);
          //$message.text(content);
          //$message.html(content);
          $message.html(`<i class="${iconClass}"></i> <pre>${formattedContent}</pre>`); // Add Font Awesome icon to the message
        } else if (role === 'assistant') {
          $message.addClass('assistant-message');
          const formattedContent = formatMarkdown(content);
          //$message.html(formattedContent);
          $message.html(`<p align="right"><i class="${iconClass}"></i> ${formattedContent}</p>`); // Add Font Awesome icon to the message
        }
      
        $chatHistory.append($message);
        $chatHistory.scrollTop($chatHistory[0].scrollHeight);
      }



      

      function formatMarkdown(input) {
        const md = window.markdownit({
          html: true, // Enable HTML tags in the output
          highlight: function (code, lang) {
            // Custom highlighting function, you can use your preferred syntax highlighter library here
            // This example uses Prism.js (https://prismjs.com/)
            if (lang && Prism.languages[lang]) {
              return Prism.highlight(code, Prism.languages[lang], lang);
            }
            return code; // If language is not specified or not supported, return the plain code
          },
        });
      
        // Add a custom class to code blocks for styling
        md.renderer.rules.fence = function (tokens, idx, options, env, slf) {
          const token = tokens[idx];
          const code = token.content.trim();
          const lang = token.info || '';
      
          // Generate the HTML for the code block
          let html = '<pre class="code-block"><code';
      
          if (lang) {
            html += ' class="language-' + lang + '"';
          }
      
          html += '>' + md.utils.escapeHtml(code) + '</code>';
      
          // Add the copy button to the code block
          html += '<button class="copy-button">Copy</button>';
      
          html += '</pre>';
      
          return html;
        };
      
        return md.render(input);
      }
      
      // Copy button functionality
      $(document).on('click', '.copy-button', function() {
        const codeBlock = $(this).prev('code');
        const codeText = codeBlock.text();
      
        const textarea = document.createElement('textarea');
        textarea.value = codeText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      
        $(this).text('Copied!');
      });
      
      
      
      


    //function to update the temperature slider value
    $(function() {
        var temperatureInput = $('#temperature-input');
        var temperatureSlider = $('#temperature-slider');

        var maxLengthInput = $('#max-length-input');
        var maxLengthSlider = $('#max-length-slider');

        temperatureInput.on('input', function() {
            temperatureSlider.val(this.value);
        });

        temperatureSlider.on('input', function() {
            temperatureInput.val(this.value);
        });


        maxLengthInput.on('input', function() {
            maxLengthSlider.val(this.value);
        });

        maxLengthSlider.on('input', function() {
            maxLengthInput.val(this.value);
        });

    });
      

    function loadChatHistory(query = '') {

        $.ajax({
          type: 'GET',
          url: '/chat_history',
          success: function (response) {
            let $sidebar = $('.left-sidebar-history');
            $sidebar.empty();
            let sidebarHeight = $sidebar.height();
            let availableHeight = sidebarHeight - 40; // Subtract the padding (20px top + 20px bottom)
      
            for (let fullFilename of response) {
              // Trim 'chat_history/' from the beginning and '.json' from the end
              let filename = fullFilename.replace('chat_history/', '').replace('.json', '');

              // Skip this file if it doesn't match the search query
              if (!filename.toLowerCase().includes(query.toLowerCase())) {
                 continue;
              }
      
              let $renameButton = $('<button>')
                .addClass('btn btn-secondary')
                .html('<i class="fas fa-edit"></i>') // Font Awesome icon for renaming
                .hide() // Initially hidden
                .on('click', function () {
                  let newFilename = prompt('Enter new filename:', filename);
                  if (newFilename) {
                    // Add 'chat_history/' and '.json' back before sending to the server
                    newFilename = 'chat_history/' + newFilename + '.json';
      
                    $.ajax({
                      type: 'POST',
                      url: '/rename_chat',
                      contentType: 'application/json;charset=UTF-8',
                      data: JSON.stringify({ old_filename: fullFilename, new_filename: newFilename }),
                      success: function () {
                        loadChatHistory(); // reload the chat history
                      },
                    });
                  }
                });
      
              let $deleteButton = $('<button>')
                .addClass('btn btn-secondary')
                .html('<i class="fas fa-trash-alt"></i>') // Font Awesome icon for deleting
                .hide() // Initially hidden
                .on('click', function () {
                  if (confirm('Are you sure you want to delete this chat?')) {
                    $.ajax({
                      type: 'POST',
                      url: '/delete_chat',
                      contentType: 'application/json;charset=UTF-8',
                      data: JSON.stringify({ filename: fullFilename }),
                      success: function () {
                        loadChatHistory(); // reload the chat history
                      },
                    });
                  }
                });
      
                let $filenameButton = $('<button>')
                .addClass('btn btn-secondary filename-button')
                .text(filename) // Display the trimmed filename
                .on('click', function () {
                  // When the filename button is clicked, show the rename and delete buttons
                  //$renameButton.toggle();
                  //$deleteButton.toggle();
              
                  $.ajax({
                    type: 'POST',
                    url: '/load_chat',
                    contentType: 'application/json;charset=UTF-8',
                    data: JSON.stringify({ filename: fullFilename }),
                    success: function (chat) {
                      chatHistory = chat;
                      $chatHistory.empty();
                      for (let msg of chatHistory) {
                        appendMessage(msg.role, msg.content);
                      }
                    },
                  });
                });
              
              let $fileContainer = $('<div>').addClass('file-container');
              $fileContainer.append($filenameButton, $renameButton, $deleteButton);
              // Add hover event handlers to show/hide the rename and delete buttons
            $fileContainer.hover(
                function () {
                $(this).addClass('hovered');
                },
                function () {
                $(this).removeClass('hovered');
                }
            );
              $sidebar.append($fileContainer);
              
      
              // Subtract the height of the added file container from the available height
              availableHeight -= $fileContainer.outerHeight(true);
      
              if (availableHeight <= 0) {
                $sidebar.css('overflow-y', 'auto');
              }
            }
          },
        });
      }
      
    
    // Add event listener for the search input
$('#search-input').on('input', function() {
    loadChatHistory($(this).val());
});

let $newChatButton = $('#new-chat-button');
$('#new-chat-button').on('click', function() {
    location.reload();
  });


  $('#clear-chat-button').click(function() {
    if (confirm('Are you sure you want to clear all chats? This action cannot be undone.')) {
        $.ajax({
            url: '/clear_chats',
            type: 'POST',
            success: function(response) {
                // You can add a success message here
                console.log("All chats cleared");
                // refresh chat history on the UI
                loadChatHistory();
            },
            error: function(error) {
                console.log(error);
            }
        });
    }
});

  

    $sendMessage.on('click', function() {
        let message = $messageInput.val().trim();

        

        if (message) {
            appendMessage('user', message);
            chatHistory.push({ role: 'user', content: message });
            $messageInput.val('');

            let modelName = $modelSelector.val(); // Update the model name based on the selected value
            let maxLength = $maxlengthslider.val(); 
            let temperature = $temperatureslider.val(); 

            // Add a loading message
            $('#chat-history').append('<p class="loading-message">Loading...</p>');
        
            
            // Send the message to the openAI server
            $.ajax({
                type: 'POST',
                url: '/chat',
                contentType: 'application/json;charset=UTF-8',
                data: JSON.stringify({ chat_history: chatHistory, message: message, model: modelName, maxLength: maxLength, temperature: temperature }),
                success: function(response) {
                    
                    // Remove the loading message
                    $('.loading-message').remove();

                    appendMessage('assistant', response);
                    formattedText = formatMarkdown(response);

                    chatHistory.push({ role: 'assistant', content: response });

                    //const userInput = 'Here is some *bold* and _italic_ text.';
                    formattedText = formatMarkdown(response);


                    // Update the filename for saving the chat history
                    if (!filename) {
                        let date = new Date();
                        filename = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '_' + date.getHours() + '-' + date.getMinutes() + '-' + date.getSeconds();
                    }

                    // Save the chat history
                    $.ajax({
                        type: 'POST',
                        url: '/save_chat',
                        contentType: 'application/json;charset=UTF-8',
                        //data: JSON.stringify({ chat: chatHistory, filename: filename }) 
                        data: JSON.stringify({ chat: chatHistory, filename: filename, formattedText: formattedText })

                    }); 


                },
                error: function() {
                    alert('Error! Please try again.');
                    // Don't forget to remove the loading message if there's an error
                    $('.loading-message').remove();
                }
            });
            


        }
    });

    loadChatHistory();


    $messageInput.on('keypress', function(event) {
        if (event.which === 13 && !event.shiftKey) {
            event.preventDefault();
            $sendMessage.click();
        }
    });
});
