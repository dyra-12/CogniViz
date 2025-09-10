import styled from 'styled-components';

const SchedulerContainer = styled.div`
  background: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[5]};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.md};
  margin-bottom: ${props => props.theme.spacing[6]};
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${props => props.theme.spacing[4]};
  margin-top: ${props => props.theme.spacing[4]};
`;

const DayColumn = styled.div`
  border: 1px solid ${props => props.theme.colors.gray300};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing[3]};
`;

const DayHeader = styled.h4`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing[3]};
  color: ${props => props.theme.colors.primary};
`;

const TimeSlot = styled.div`
  border: 1px solid ${props => props.theme.colors.gray200};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing[2]};
  margin-bottom: ${props => props.theme.spacing[2]};
  min-height: 40px;
  background: ${props => props.hasMeeting ? props.theme.colors.primary : props.theme.colors.gray50};
  color: ${props => props.hasMeeting ? props.theme.colors.white : props.theme.colors.gray700};
  cursor: ${props => props.hasMeeting ? 'move' : 'default'};
  
  &:hover {
    background: ${props => props.hasMeeting ? props.theme.colors.primary : props.theme.colors.gray100};
  }
`;

const UnscheduledMeetings = styled.div`
  margin-top: ${props => props.theme.spacing[6]};
  padding: ${props => props.theme.spacing[4]};
  background: ${props => props.theme.colors.gray100};
  border-radius: ${props => props.theme.borderRadius.lg};
`;

const MeetingItem = styled.div`
  padding: ${props => props.theme.spacing[3]};
  margin-bottom: ${props => props.theme.spacing[2]};
  background: ${props => props.theme.colors.warning}20;
  border: 1px solid ${props => props.theme.colors.warning};
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: move;
  
  &:hover {
    background: ${props => props.theme.colors.warning}30;
  }
`;

const MeetingScheduler = ({ meetings, onMeetingSchedule }) => {
  const days = [1, 2, 3, 4];
  const hours = [9, 10, 11, 12, 13, 14, 15, 16]; // 9AM-4PM

  const handleDragStart = (e, meeting) => {
    e.dataTransfer.setData('meetingId', meeting.id);
  };

  const handleDrop = (e, day, hour) => {
    e.preventDefault();
    const meetingId = e.dataTransfer.getData('meetingId');
    onMeetingSchedule(meetingId, day, hour);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const getMeetingInSlot = (day, hour) => {
    return meetings.find(m => m.scheduled && m.day === day && m.startTime === hour);
  };

  const unscheduledMeetings = meetings.filter(m => !m.scheduled);

  return (
    <SchedulerContainer>
      <h3>Schedule Your Meetings</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Constraints:</strong> 9AM-5PM only, no overlaps, Client meeting on Day 2 or 3 only
      </div>

      <CalendarGrid>
        {days.map(day => (
          <DayColumn key={day}>
            <DayHeader>Day {day}</DayHeader>
            {hours.map(hour => {
              const meeting = getMeetingInSlot(day, hour);
              return (
                <TimeSlot
                  key={hour}
                  hasMeeting={!!meeting}
                  onDrop={(e) => handleDrop(e, day, hour)}
                  onDragOver={handleDragOver}
                >
                  {meeting ? (
                    <div draggable onDragStart={(e) => handleDragStart(e, meeting)}>
                      {meeting.title} ({meeting.duration}h)
                    </div>
                  ) : (
                    `${hour}:00`
                  )}
                </TimeSlot>
              );
            })}
          </DayColumn>
        ))}
      </CalendarGrid>

      {unscheduledMeetings.length > 0 && (
        <UnscheduledMeetings>
          <h4>Unscheduled Meetings (Drag to calendar)</h4>
          {unscheduledMeetings.map(meeting => (
            <MeetingItem
              key={meeting.id}
              draggable
              onDragStart={(e) => handleDragStart(e, meeting)}
            >
              {meeting.title} ({meeting.duration} hours)
            </MeetingItem>
          ))}
        </UnscheduledMeetings>
      )}
    </SchedulerContainer>
  );
};

export default MeetingScheduler;