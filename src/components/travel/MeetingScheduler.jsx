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
  gap: ${props => props.theme.spacing[2]};
  margin-top: ${props => props.theme.spacing[2]};
`;

const DayColumn = styled.div`
  border: 1px solid ${props => props.theme.colors.gray300};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => `${props.theme.spacing[2]} 0`};
  min-height: 220px;
`;

const DayHeader = styled.h4`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing[3]};
  color: ${props => props.theme.colors.primary};
  font-size: ${props => props.theme.fontSizes.lg};
  font-weight: 700;
`;

const TimeSlot = styled.div`
  border: 1px solid ${props => props.theme.colors.gray200};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: 6px 4px;
  margin-bottom: 4px;
  min-height: 32px;
  background: ${props => props.hasMeeting ? props.theme.colors.primary : props.theme.colors.gray50};
  color: ${props => props.hasMeeting ? props.theme.colors.white : props.theme.colors.gray700};
  cursor: ${props => props.hasMeeting ? 'move' : 'default'};
  font-size: 0.7rem;
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
  font-size: ${props => props.theme.fontSizes.sm};
  
  &:hover {
    background: ${props => props.theme.colors.warning}30;
  }
`;

const MeetingConstraints = styled.div`
  font-size: ${props => props.theme.fontSizes.xs};
  margin-top: ${props => props.theme.spacing[1]};
  color: ${props => props.theme.colors.gray600};
`;

const ConstraintBadge = styled.span`
  display: inline-block;
  background: ${props => props.theme.colors.info}20;
  color: ${props => props.theme.colors.info};
  padding: 1px 4px;
  border-radius: 8px;
  margin-right: 2px;
  font-size: 0.65rem;
  border: 1px solid ${props => props.theme.colors.info}30;
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

  const getConstraintBadges = (meeting) => {
    const badges = [];
    
    if (meeting.constraints.allowedDays) {
      badges.push(`Day ${meeting.constraints.allowedDays.join('/')}`);
    }
    
    if (meeting.constraints.timeRange) {
      badges.push(`${meeting.constraints.timeRange.start}:00-${meeting.constraints.timeRange.end}:00`);
    }
    
    if (meeting.constraints.mustFollow) {
      badges.push('After Client');
    }
    
    if (meeting.constraints.mustPrecede) {
      badges.push('Before Team');
    }
    
    if (meeting.constraints.cannotOverlapWith) {
      badges.push('No Overlap');
    }
    
    return badges;
  };

  return (
    <SchedulerContainer>
      <h3>Schedule Your Meetings</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Complex Constraints:</strong> Each meeting has specific day, time, and dependency requirements. Check the badges below each meeting for details.
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
                      <div><strong>{meeting.title}</strong></div>
                      <div>({meeting.duration}h, {hour}:00-{hour + meeting.duration}:00)</div>
                      <div>
                        {getConstraintBadges(meeting).map((badge, index) => (
                          <ConstraintBadge key={index}>{badge}</ConstraintBadge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '1rem', fontWeight: 600, paddingLeft: '10px', display: 'inline-block' }}>{hour}:00</span>
                  )}
                </TimeSlot>
              );
            })}
          </DayColumn>
        ))}
      </CalendarGrid>
      {/* Unscheduled Meetings Section */}
      {unscheduledMeetings.length > 0 && (
        <UnscheduledMeetings>
          <h4>Unscheduled Meetings</h4>
          {unscheduledMeetings.map(meeting => (
            <MeetingItem
              key={meeting.id}
              draggable
              onDragStart={(e) => handleDragStart(e, meeting)}
            >
              <div><strong>{meeting.title}</strong> ({meeting.duration}h)</div>
              <MeetingConstraints>
                {getConstraintBadges(meeting).map((badge, index) => (
                  <ConstraintBadge key={index}>{badge}</ConstraintBadge>
                ))}
              </MeetingConstraints>
            </MeetingItem>
          ))}
        </UnscheduledMeetings>
      )}
    </SchedulerContainer>
  );
};

export default MeetingScheduler;