-- Seed lookup rows required by friend_requests.status FK (ids 0–3).
INSERT INTO `friend_request_statuses` (`id`, `name`) VALUES
    (0, 'pending'),
    (1, 'accepted'),
    (2, 'rejected'),
    (3, 'cancelled')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
