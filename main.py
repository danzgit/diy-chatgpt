import os
import json
import glob
from flask import Flask, render_template, request, jsonify, send_from_directory
import openai

app = Flask(__name__)
openai.api_key = "<YOUR-OPENAI-API-KEY>"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat_history', methods=['GET'])
def get_chat_history():
    files = glob.glob('chat_history/*.json')
    files.sort(key=os.path.getmtime, reverse=True)
    return jsonify(files)

@app.route('/save_chat', methods=['POST'])
def save_chat():
    data = request.get_json()
    with open(f'chat_history/{data["filename"]}.json', 'w') as f:
        json.dump(data["chat"], f)
    return '', 204

@app.route('/load_chat', methods=['POST'])
def load_chat():
    data = request.get_json()
    filename = data.get('filename', '')
    with open(filename, 'r') as f:
        chat = json.load(f)
    return jsonify(chat)

import os

@app.route('/rename_chat', methods=['POST'])
def rename_chat():
    old_filename = request.json['old_filename']
    new_filename = request.json['new_filename']
    
    try:
        os.rename(f'{old_filename}', f'{new_filename}')
        return '', 200
    except Exception as e:
        print(e)  # log the error for debugging
        return '', 500

@app.route('/delete_chat', methods=['POST'])
def delete_chat():
    filename = request.json['filename']
    
    try:
        os.remove(f'{filename}')
        return '', 200
    except Exception as e:
        print(e)  # log the error for debugging
        return '', 500


@app.route('/clear_chats', methods=['POST'])
def clear_chats():
    files = glob.glob('chat_history/*.json')
    for f in files:
        try:
            os.remove(f)
        except OSError as e:
            print(f"Error: {f} : {e.strerror}")
    return '', 204


@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    chat_history = data.get('chat_history', [])
    message = data.get('message', '')
    model_name = data.get('model', 'gpt-3.5-turbo')
    temperature = float(data.get('temperature', '0.7'))
    max_tokens = int(data.get('maxLength', '100'))
    

    response = openai.ChatCompletion.create(
        model=model_name,
        temperature=temperature,
        max_tokens=max_tokens,
        messages=[{"role": "system", "content": "You are a helpful assistant."}] + chat_history,
    )
    return jsonify(response.choices[0].message['content'].strip())


if not os.path.exists('chat_history'):
    os.makedirs('chat_history')

if __name__ == '__main__':
    app.run(debug=True)
