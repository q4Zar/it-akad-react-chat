import React, { useState } from 'react';
import {
    Route,
    Switch,
    Redirect
} from "react-router-dom";
import JoinRoom from './screens/JoinRoom';
import ChatRoom from './screens/ChatRoom';

import { history } from './config/network';

function App() {

    // react hooks var + setter : https://reactjs.org/docs/hooks-state.html
    const [username, setUsername] = useState('');
    const [room, setRoom] = useState('');
    const [joinData, setJoinData] = useState({});
    console.log(username, room, joinData)
    function onJoinSuccess(data) {
        // on connexion set data to states
        setJoinData(data);
        setUsername(data.userData.username);
        setRoom(data.userData.room);
        // add new room to history
        history.push(`/chat/rooms/${data.userData.room}`);
    }
    return (
        <div className="App">
            {/* Switch by default will match only one at a given time. */}
             <Switch>
                 {/*  */}
                <Route 
                    path="/join" 
                    component={() => <JoinRoom onJoinSuccess={onJoinSuccess}/>}
                />
                {/* Rendering a <Redirect> will navigate to a new location. The new location will override the current location in the history stack, like server-side redirects (HTTP 3xx) do. */}
                <Redirect 
                    from="/" 
                    to="/join" 
                    exact 
                />
                {/*  */}
                <Route 
                    path="/chat/rooms/:roomNumber" 
                    component={() => 
                        <ChatRoom 
                            username={username} 
                            room={room} 
                            joinData={joinData}
                        /> 
                    } 
                />
            </Switch>
        </div>
    );
}
export default App;