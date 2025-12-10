package za.co.taxipoint.dto;

public class UserStatsDTO {
    private long users;      // ROLE_USER (commuters)
    private long admins;     // ROLE_ADMIN
    private long total;
    public UserStatsDTO() {}
    public UserStatsDTO(long users, long admins) {
        this.users = users;
        this.admins = admins;
        this.total = users + admins;
    }
    // Getters and Setters
    public long getUsers() { return users; }
    public void setUsers(long users) { this.users = users; }
    
    public long getAdmins() { return admins; }
    public void setAdmins(long admins) { this.admins = admins; }
    
    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }
}