import React, { useState } from 'react';
import '../styles/ProfileEditor.css';

function ProfileEditor() {
  const [profile, setProfile] = useState({
    name: 'Иван Иванов',
    profession: 'Frontend разработчик',
    description: 'Увлекаюсь созданием интерактивных веб-приложений'
  });

  const handleChange = (field, value) => {
    setProfile({
      ...profile,
      [field]: value
    });
  };

  return (
    <div className="profile-editor-container">
      <h3>Редактор профиля</h3>
      <div className="editor-layout">
        <div className="editor-form">
          <div className="form-group">
            <label>Имя:</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Профессия:</label>
            <input
              type="text"
              value={profile.profession}
              onChange={(e) => handleChange('profession', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Описание:</label>
            <textarea
              value={profile.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows="4"
            />
          </div>
        </div>
        
        <div className="profile-card">
          <div className="profile-avatar">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <h4>{profile.name}</h4>
          <p className="profession">{profile.profession}</p>
          <p className="description">{profile.description}</p>
        </div>
      </div>
    </div>
  );
}

export default ProfileEditor;