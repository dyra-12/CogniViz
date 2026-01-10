import { useMemo } from 'react';
import styled from 'styled-components';
import Button from '../Button';

const SchedulerContainer = styled.div`
  background: ${props => props.theme.colors.white};
  padding: ${props => props.theme.spacing[5]};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.md};
  margin-bottom: ${props => props.theme.spacing[6]};
`;

const AdaptiveCallout = styled.div`
  margin-bottom: ${props => props.theme.spacing[3]};
  padding: ${props => props.theme.spacing[3]};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.info}12;
  border: 1px dashed ${props => props.theme.colors.info};
  color: ${props => props.theme.colors.info};
  font-weight: 600;
`;

const NoiseNotice = styled.div`
  margin-bottom: ${props => props.theme.spacing[2]};
  color: ${props => props.theme.colors.gray700};
  font-size: ${props => props.theme.fontSizes.sm};
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing[3]};
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
  min-height: ${props => props.$collapsed ? '120px' : '220px'};
  opacity: ${props => props.$collapsed ? 0.55 : 1};
  position: relative;
  overflow: hidden;
`;

const DayHeader = styled.h4`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing[3]};
  color: ${props => props.theme.colors.primary};
  font-size: ${props => props.theme.fontSizes.lg};
  font-weight: 700;
`;

const TimeSlot = styled.div`
  border: ${props => {
    if (props.$attemptedViolation) return `2px solid ${props.theme.colors.danger}`;
    if (props.$conflict) return `2px solid ${props.theme.colors.danger}`;
    return `1px solid ${props.theme.colors.gray200}`;
  }};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: 6px 4px;
  margin-bottom: 4px;
  min-height: 32px;
  background: ${props => {
    if (props.$attemptedViolation) return `${props.theme.colors.danger}12`;
    if (props.hasMeeting && props.$conflict) return `${props.theme.colors.danger}30`;
    if (props.hasMeeting) return props.theme.colors.primary;
    if (props.$conflict) return `${props.theme.colors.danger}15`;
    return props.theme.colors.gray50;
  }};
  color: ${props => {
    if (props.$attemptedViolation) return props.theme.colors.danger;
    return props.hasMeeting ? props.theme.colors.white : props.theme.colors.gray700;
  }};
  cursor: ${props => props.hasMeeting ? 'move' : 'default'};
  font-size: 0.7rem;
  box-shadow: ${props => {
    if (props.$attemptedViolation) return `0 0 0 2px ${props.theme.colors.danger}40`;
    return props.$focused ? `0 0 0 2px ${props.theme.colors.warning}` : 'none';
  }};
  opacity: ${props => props.$collapsed ? 0.65 : 1};
  position: relative;

  &:hover {
    background: ${props => {
      if (props.$attemptedViolation) return `${props.theme.colors.danger}18`;
      if (props.hasMeeting && props.$conflict) return `${props.theme.colors.danger}35`;
      if (props.hasMeeting) return props.theme.colors.primary;
      if (props.$conflict) return `${props.theme.colors.danger}20`;
      return props.theme.colors.gray100;
    }};
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
  background: ${props => props.$violated ? `${props.theme.colors.danger}12` : `${props.theme.colors.warning}20`};
  border: ${props => props.$violated
    ? `2px solid ${props.theme.colors.danger}`
    : `1px solid ${props.theme.colors.warning}`};
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'move'};
  opacity: ${props => props.$disabled ? 0.5 : 1};
  font-size: ${props => props.theme.fontSizes.sm};
  box-shadow: ${props => props.$violated ? `0 0 0 2px ${props.theme.colors.danger}25` : 'none'};
  transition: background 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    background: ${props => props.$violated ? `${props.theme.colors.danger}20` : `${props.theme.colors.warning}30`};
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

const ConflictBadge = styled.span`
  display: inline-block;
  background: ${props => props.theme.colors.danger}15;
  color: ${props => props.theme.colors.danger};
  padding: 2px 6px;
  border-radius: 999px;
  margin-top: 4px;
  font-size: 0.65rem;
  font-weight: 600;
  border: 1px solid ${props => props.theme.colors.danger}30;
`;

const ComplexIntro = styled.div`
  margin-bottom: ${props => props.theme.spacing[4]};
  color: ${props => props.theme.colors.danger};
`;

const CueBadge = styled.span`
  display: inline-block;
  margin-right: 6px;
  margin-bottom: 4px;
  padding: 3px 6px;
  border-radius: 10px;
  background: ${props => props.theme.colors.info}18;
  color: ${props => props.theme.colors.info};
  font-size: 0.7rem;
  font-weight: 700;
  border: 1px solid ${props => props.theme.colors.info}35;
`;

const ViolationNotice = styled.div`
  margin-bottom: ${props => props.theme.spacing[3]};
  padding: ${props => props.theme.spacing[3]};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.danger}12;
  border: 1px solid ${props => props.theme.colors.danger}35;
  color: ${props => props.theme.colors.danger};
  font-weight: 600;
`;

const ViolationSlotNote = styled.div`
  position: absolute;
  inset: 2px;
  border-radius: ${props => props.theme.borderRadius.sm};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: ${props => props.theme.colors.danger};
  background: rgba(255, 255, 255, 0.95);
  text-align: center;
  padding: 4px;
  pointer-events: none;
`;

const MeetingScheduler = ({
  meetings,
  onMeetingSchedule,
  onMeetingDragStart,
  onMeetingDropAttempt,
  onComponentEnter,
  onResetMeetings,
  conflictDetails,
  adaptiveMode,
  highlightConflicts = false,
  suppressNewDrags = false,
  violationAttempt = null
}) => {
  const days = [1, 2, 3, 4];
  const hours = [9, 10, 11, 12, 13, 14, 15, 16]; // 9AM-4PM

  const conflictsByMeeting = conflictDetails?.conflictsByMeeting || {};
  const conflictSlotMap = useMemo(() => {
    const map = new Map();
    if (conflictDetails?.conflictSlots) {
      conflictDetails.conflictSlots.forEach(slot => {
        map.set(`${slot.day}-${slot.hour}`, slot);
      });
    }
    return map;
  }, [conflictDetails]);

  const focusedDaysSet = useMemo(() => new Set(adaptiveMode?.focusedDays || []), [adaptiveMode]);
  const collapseInactive = adaptiveMode?.collapseInactiveDays && focusedDaysSet.size > 0;

  const blockNewDrags = (highlightConflicts && Object.keys(conflictsByMeeting).length > 0) || suppressNewDrags;

  const attemptedSlotKey = violationAttempt ? `${violationAttempt.day}-${violationAttempt.hour}` : null;
  const attemptedMeetingId = violationAttempt?.meetingId;
  const formatHourLabel = (value) => `${String(value).padStart(2, '0')}:00`;

  const handleDragStart = (e, meeting) => {
    if (blockNewDrags && !meeting.scheduled) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('meetingId', meeting.id);
    if (typeof onMeetingDragStart === 'function') {
      try { onMeetingDragStart(meeting.id); } catch (err) { /* ignore */ }
    }
  };

  const handleDrop = (e, day, hour) => {
    e.preventDefault();
    const meetingId = e.dataTransfer.getData('meetingId');
    if (typeof onMeetingDropAttempt === 'function') {
      try { onMeetingDropAttempt(meetingId, day, hour); } catch (err) { /* ignore */ }
    } else if (typeof onMeetingSchedule === 'function') {
      // fallback for older prop name
      try { onMeetingSchedule(meetingId, day, hour); } catch (err) { /* ignore */ }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const getMeetingInSlot = (day, hour) => {
    // Return meeting occupying this slot (start <= hour < start+duration)
    return meetings.find(m => m.scheduled && m.day === day && m.startTime <= hour && (m.startTime + m.duration) > hour);
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
    <SchedulerContainer onMouseEnter={() => { if (typeof onComponentEnter === 'function') onComponentEnter('Meetings'); }}>
      <HeaderContainer>
        <h3>Schedule Your Meetings</h3>
        {onResetMeetings && (
          <Button 
            variant="secondary" 
            onClick={onResetMeetings}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          >
            🔄 Start from Beginning
          </Button>
        )}
      </HeaderContainer>
      
      <ComplexIntro>
        <strong>Complex Constraints:</strong> Each meeting has specific day, time, and dependency requirements. Check the badges below each meeting for details.
      </ComplexIntro>

      {violationAttempt && (
        <ViolationNotice>
          <div>
            {violationAttempt.meetingTitle || 'This meeting'} can’t go in Day {violationAttempt.day} at {formatHourLabel(violationAttempt.hour)}.
          </div>
          <div style={{ marginTop: '4px', fontSize: '0.75rem', fontWeight: 500 }}>
            {violationAttempt.message}
          </div>
        </ViolationNotice>
      )}

      {adaptiveMode?.hint && (
        <AdaptiveCallout>
          {adaptiveMode.hint}
        </AdaptiveCallout>
      )}

      {adaptiveMode?.dependencyCues?.length > 0 && (
        <NoiseNotice>
          {adaptiveMode.dependencyCues.map((cue, index) => (
            <CueBadge key={index}>{cue}</CueBadge>
          ))}
        </NoiseNotice>
      )}

      {collapseInactive && (
        <NoiseNotice>
          Dimming days without conflicts to reduce visual noise. All slots remain usable.
        </NoiseNotice>
      )}

      <CalendarGrid>
        {days.map(day => (
          <DayColumn key={day} $collapsed={collapseInactive && !focusedDaysSet.has(day)}>
            <DayHeader>Day {day}</DayHeader>
            {hours.map(hour => {
              const meeting = getMeetingInSlot(day, hour);
              const isStart = meeting && meeting.startTime === hour;
              const slotKey = `${day}-${hour}`;
              const slotEntry = conflictSlotMap.get(slotKey);
              const slotConflict = highlightConflicts && Boolean(slotEntry);
              const attemptedViolation = attemptedSlotKey === slotKey;
              const slotFocused = slotConflict && Array.isArray(adaptiveMode?.focusTargets) && (
                adaptiveMode.focusTargets.includes('meetingSchedule') || (slotEntry?.types || []).some(type => adaptiveMode.focusTargets.includes(type))
              );
              return (
                <TimeSlot
                  key={hour}
                  hasMeeting={!!meeting}
                  onDrop={(e) => handleDrop(e, day, hour)}
                  onDragOver={handleDragOver}
                  $conflict={slotConflict}
                  $focused={slotFocused}
                  $collapsed={collapseInactive && !focusedDaysSet.has(day)}
                  $attemptedViolation={attemptedViolation}
                >
                  {meeting ? (
                    isStart ? (
                      <div draggable onDragStart={(e) => handleDragStart(e, meeting)}>
                        <div><strong>{meeting.title}</strong></div>
                        <div>({meeting.duration}h, {meeting.startTime}:00-{meeting.startTime + meeting.duration}:00)</div>
                        <div>
                          {getConstraintBadges(meeting).map((badge, index) => (
                            <ConstraintBadge key={index}>{badge}</ConstraintBadge>
                          ))}
                        </div>
                        {highlightConflicts && conflictsByMeeting[meeting.id] && conflictsByMeeting[meeting.id].map((conflict, index) => (
                          <ConflictBadge key={index}>{conflict.message}</ConflictBadge>
                        ))}
                      </div>
                    ) : (
                      <div style={{ opacity: 0.85, fontStyle: 'italic' }}>Continued: {meeting.title}</div>
                    )
                  ) : (
                    <span style={{ fontSize: '1rem', fontWeight: 600, paddingLeft: '10px', display: 'inline-block' }}>{formatHourLabel(hour)}</span>
                  )}
                  {attemptedViolation && (
                    <ViolationSlotNote>
                      <span>⚠ Attempted</span>
                      <span>{violationAttempt?.meetingTitle || 'Meeting'}</span>
                    </ViolationSlotNote>
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
              draggable={!blockNewDrags}
              $disabled={blockNewDrags}
              $violated={attemptedMeetingId === meeting.id}
              onDragStart={(e) => handleDragStart(e, meeting)}
            >
              <div><strong>{meeting.title}</strong> ({meeting.duration}h)</div>
              <MeetingConstraints>
                {getConstraintBadges(meeting).map((badge, index) => (
                  <ConstraintBadge key={index}>{badge}</ConstraintBadge>
                ))}
              </MeetingConstraints>
              {attemptedMeetingId === meeting.id && violationAttempt?.message && (
                <ConflictBadge>{violationAttempt.message}</ConflictBadge>
              )}
            </MeetingItem>
          ))}
          {blockNewDrags && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#b91c1c', fontWeight: 600 }}>
              Resolve highlighted conflicts before adding new meetings.
            </div>
          )}
        </UnscheduledMeetings>
      )}
    </SchedulerContainer>
  );
};

export default MeetingScheduler;