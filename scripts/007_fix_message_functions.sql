-- Fixed function to get user conversations with last message and unread count
CREATE OR REPLACE FUNCTION get_user_conversations(user_id UUID)
RETURNS TABLE (
  other_user_id UUID,
  full_name TEXT,
  user_type TEXT,
  farm_name TEXT,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  unread_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH conversation_users AS (
    SELECT DISTINCT
      CASE 
        WHEN m.sender_id = user_id THEN m.receiver_id
        ELSE m.sender_id
      END as other_user_id
    FROM messages m
    WHERE m.sender_id = user_id OR m.receiver_id = user_id
  ),
  last_messages AS (
    SELECT DISTINCT ON (
      CASE 
        WHEN m.sender_id = user_id THEN m.receiver_id
        ELSE m.sender_id
      END
    )
      CASE 
        WHEN m.sender_id = user_id THEN m.receiver_id
        ELSE m.sender_id
      END as other_user_id,
      m.message as last_message,
      m.created_at as last_message_time
    FROM messages m
    WHERE m.sender_id = user_id OR m.receiver_id = user_id
    ORDER BY 
      CASE 
        WHEN m.sender_id = user_id THEN m.receiver_id
        ELSE m.sender_id
      END,
      m.created_at DESC
  ),
  unread_counts AS (
    SELECT 
      m.sender_id as other_user_id,
      COUNT(*) as unread_count
    FROM messages m
    WHERE m.receiver_id = user_id AND m.is_read = false
    GROUP BY m.sender_id
  )
  SELECT 
    cu.other_user_id,
    p.full_name,
    p.user_type,
    fp.farm_name,
    lm.last_message,
    lm.last_message_time,
    COALESCE(uc.unread_count, 0) as unread_count
  FROM conversation_users cu
  JOIN profiles p ON p.id = cu.other_user_id
  LEFT JOIN farmer_profiles fp ON fp.id = p.id
  JOIN last_messages lm ON lm.other_user_id = cu.other_user_id
  LEFT JOIN unread_counts uc ON uc.other_user_id = cu.other_user_id
  ORDER BY lm.last_message_time DESC;
END;
$$;
