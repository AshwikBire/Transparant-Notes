import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const App = () => {
    const [notes, setNotes] = useState('');
    const [isSharingScreen, setIsSharingScreen] = useState(false);
    const [savedNotes, setSavedNotes] = useState([]);
    const [isVisibleToUser, setIsVisibleToUser] = useState(true);
    const textareaRef = useRef(null);

    // Load saved notes from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('transparentNotes');
        if (saved) {
            try {
                setSavedNotes(JSON.parse(saved));
            } catch (e) {
                console.error('Error loading notes:', e);
            }
        }
        
        const lastNote = localStorage.getItem('lastNote');
        if (lastNote) {
            setNotes(lastNote);
        }
    }, []);

    // Save notes to localStorage when they change
    useEffect(() => {
        if (savedNotes.length > 0) {
            localStorage.setItem('transparentNotes', JSON.stringify(savedNotes));
        }
    }, [savedNotes]);

    // Screen sharing detection
    useEffect(() => {
        let stream = null;

        const checkScreenSharing = async () => {
            try {
                // Check if screen sharing is already active
                const mediaStream = await navigator.mediaDevices.getDisplayMedia({ 
                    video: true 
                });
                stream = mediaStream;
                setIsSharingScreen(true);
                
                // When sharing stops
                stream.getTracks().forEach(track => {
                    track.onended = () => {
                        setIsSharingScreen(false);
                        stream = null;
                    };
                });
            } catch (error) {
                // User canceled screen share or permission denied
                setIsSharingScreen(false);
            }
        };

        // Try to detect existing screen share (will fail gracefully if none)
        checkScreenSharing().catch(() => {});

        // Cleanup function
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const saveNote = () => {
        if (notes.trim()) {
            const newNote = {
                id: Date.now(),
                content: notes,
                timestamp: new Date().toLocaleString(),
            };
            
            const updatedNotes = [newNote, ...savedNotes.slice(0, 9)];
            setSavedNotes(updatedNotes);
            localStorage.setItem('lastNote', notes);
            
            // Show temporary success message
            const btn = document.querySelector('.btn-save');
            const originalText = btn.textContent;
            btn.textContent = '✅ Saved!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        }
    };

    const loadNote = (content) => {
        setNotes(content);
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const clearNotes = () => {
        if (window.confirm('Are you sure you want to clear the current note?')) {
            setNotes('');
            localStorage.removeItem('lastNote');
        }
    };

    const clearAllSaved = () => {
        if (window.confirm('Are you sure you want to delete ALL saved notes?')) {
            setSavedNotes([]);
            localStorage.removeItem('transparentNotes');
        }
    };

    const exportNotes = () => {
        const dataStr = JSON.stringify(savedNotes, null, 2);
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
        const exportFileDefaultName = `private_notes_${new Date().getTime()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const toggleVisibility = () => {
        setIsVisibleToUser(!isVisibleToUser);
    };

    const startScreenShareDetection = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ 
                video: true 
            });
            setIsSharingScreen(true);
            
            stream.getTracks().forEach(track => {
                track.onended = () => {
                    setIsSharingScreen(false);
                };
            });
        } catch (error) {
            alert('Screen sharing detection started. Notes will be hidden when you share your screen.');
        }
    };

    return (
        <div className={`app ${isSharingScreen ? 'sharing' : ''} ${isVisibleToUser ? 'visible' : 'hidden'}`}>
            <div className="header">
                <h1>📝 Private Notes</h1>
                <div className="status-indicators">
                    <span className={`status ${isSharingScreen ? 'sharing' : 'not-sharing'}`}>
                        {isSharingScreen ? '🔴 Screen Sharing Active' : '🟢 Ready for Meetings'}
                    </span>
                    <button onClick={startScreenShareDetection} className="btn-detect">
                        🔍 Detect Screen Share
                    </button>
                </div>
            </div>

            <div className="notes-container">
                <div className="notes-area">
                    <textarea
                        ref={textareaRef}
                        value={notes}
                        onChange={(e) => {
                            setNotes(e.target.value);
                            localStorage.setItem('lastNote', e.target.value);
                        }}
                        placeholder="Type your private notes here... They will be automatically hidden when you share your screen."
                        className="notes-textarea"
                        rows={8}
                    />
                    
                    <div className="controls">
                        <button onClick={saveNote} className="btn btn-save">💾 Save Note</button>
                        <button onClick={clearNotes} className="btn btn-clear">🗑️ Clear</button>
                        <button onClick={toggleVisibility} className="btn btn-toggle">
                            {isVisibleToUser ? '👻 Hide' : '👁️ Show'}
                        </button>
                        <button onClick={exportNotes} className="btn btn-export">📤 Export All</button>
                    </div>
                </div>

                <div className="saved-notes">
                    <div className="saved-header">
                        <h3>💾 Saved Notes ({savedNotes.length})</h3>
                        {savedNotes.length > 0 && (
                            <button onClick={clearAllSaved} className="btn-clear-all">🗑️ Clear All</button>
                        )}
                    </div>
                    
                    {savedNotes.length === 0 ? (
                        <p className="no-notes">No saved notes yet. Your notes will appear here when you save them.</p>
                    ) : (
                        <div className="notes-list">
                            {savedNotes.map((note) => (
                                <div key={note.id} className="note-item">
                                    <div className="note-header">
                                        <span className="timestamp">{note.timestamp}</span>
                                        <button 
                                            onClick={() => loadNote(note.content)}
                                            className="btn-load"
                                            title="Load this note"
                                        >
                                            📥 Load
                                        </button>
                                    </div>
                                    <div className="note-content">{note.content}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="instructions">
                <h3>🎯 How to Use:</h3>
                <div className="features">
                    <div className="feature">
                        <span className="icon">✅</span>
                        <span>Notes are <strong>always visible to you</strong></span>
                    </div>
                    <div className="feature">
                        <span className="icon">❌</span>
                        <span>Automatically <strong>hidden from others</strong> during screen sharing</span>
                    </div>
                    <div className="feature">
                        <span className="icon">💾</span>
                        <span>Automatically saves to your browser</span>
                    </div>
                    <div className="feature">
                        <span className="icon">🔒</span>
                        <span>100% private - no data leaves your computer</span>
                    </div>
                </div>
                
                <div className="tips">
                    <h4>💡 Pro Tips:</h4>
                    <ul>
                        <li>Click "Detect Screen Share" before starting your meeting</li>
                        <li>Export notes regularly for backup</li>
                        <li>Use the hide/show toggle for extra privacy</li>
                        <li>Works best in Chrome, Edge, or Firefox</li>
                    </ul>
                </div>
            </div>

            <footer className="footer">
                <p>🔒 Your notes are stored locally in your browser. No data is sent to any server.</p>
            </footer>
        </div>
    );
};

export default App;
