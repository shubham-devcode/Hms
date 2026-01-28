const User = require('../../../models/User');
const Room = require('../../../models/Room');

// Manually assign a room to a student
exports.assignRoom = async (req, res) => {
    try {
        // Find the student by the ID provided in the URL
        const student = await User.findById(req.params.id);
        const roomId = req.body.roomId;

        // 1. Fetch the room and "populate" occupants to see actual user data
        // This helps us identify if any listed occupant was deleted from the database
        const room = await Room.findById(roomId).populate('occupants');

        if (!room) {
            req.flash('error_msg', 'Room not found');
            return res.redirect('/admin/dashboard?section=students');
        }

        // 2. Remove "Ghost" data
        // If a student was deleted but their ID is still in the room, filter them out
        const validOccupants = room.occupants.filter(user => user !== null);

        // 3. Check if the room is actually full
        if (validOccupants.length >= room.capacity) {
            
            // If we found deleted users (ghosts), clean the database immediately
            if (room.occupants.length !== validOccupants.length) {
                room.occupants = validOccupants.map(u => u._id);
                await room.save();
            }

            req.flash('error_msg', `🛑 Room ${room.roomNumber} is Full! (${validOccupants.length}/${room.capacity})`);
            return res.redirect('/admin/dashboard?section=students');
        }

        // 4. Remove student from their current room if they have one
        if (student.room) {
            // Remove the student's ID from the old room's occupants list
            await Room.findByIdAndUpdate(student.room, { $pull: { occupants: student._id } });
        }

        // 5. Add student to the new room
        room.occupants = validOccupants.map(u => u._id);
        
        // Safety check Make sure the student isn't already added to the list
        const isAlreadyAdded = room.occupants.some(id => id.toString() === student._id.toString());
        if (!isAlreadyAdded) {
            room.occupants.push(student._id);
        }

        // Save the updated room data
        await room.save();

        // 6. Update the student's record with the new room ID
        student.room = room._id;
        await student.save();

        req.flash('success_msg', `✅ Assigned to Room ${room.roomNumber}`);
        res.redirect('/admin/dashboard?section=students');

    } catch (err) {
        // Log the error in the console for debugging and show error message to user
        console.error(err);
        req.flash('error_msg', 'Server Error');
        res.redirect('/admin/dashboard?section=students');
    }
};

